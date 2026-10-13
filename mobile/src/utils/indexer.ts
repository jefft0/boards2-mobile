import { PACKAGE_PATH, TX_INDEXER_URL } from '@gno/constants/Constants'

// The realm overwrites the body of a deleted post, and removes a deleted post
// that has no replies outright, so what a deleted post held is only in the
// transactions it appears in. The indexer serves those:
//
//   - the CreateReply call that created it, found by what the call returned,
//     which is the ID the realm assigned to the new post;
//   - the ReplyDeleted event of the DeleteReply call that deleted it, which is
//     the only trace of a post the realm removed outright.
//
// The arguments of boards2 CreateReply(boardID, threadID, replyID, body),
// where replyID is the parent and zero means the thread itself.
const ARG_BOARD_ID = 0
const ARG_PARENT_ID = 2
const ARG_BODY = 3

// What a post ID looks like in the recorded response of CreateReply. The
// trailing blank line is part of the response.
const callResult = (postId: number) => `(${postId} gno.land/p/gnoland/boards/v0.ID)\n\n`
const callResultId = /^\((\d+) /

const DELETED_EVENT = 'ReplyDeleted'

const DELETED_QUERY = `query deletedPosts($boardId: String!, $threadId: String!) {
  getTransactions(
    where: {
      success: { eq: true }
      response: {
        events: {
          GnoEvent: {
            type: { eq: "${DELETED_EVENT}" }
            pkg_path: { eq: "${PACKAGE_PATH}" }
            attrs: { _and: [{ key: { eq: "boardID" } }, { value: { eq: $boardId } }] }
            _and: [{ attrs: { _and: [{ key: { eq: "threadID" } }, { value: { eq: $threadId } }] } }]
          }
        }
      }
    }
  ) {
    response {
      events {
        __typename
        ... on GnoEvent {
          type
          attrs {
            key
            value
          }
        }
      }
    }
  }
}`

type Attribute = { key?: string; value?: string }
type Message = { __typename?: string; caller?: string; args?: string[] }

type IndexerResponse = {
  data?: {
    getBlocks?: { height?: number; time?: string }[]
    getTransactions?: {
      block_height?: number
      response?: { data?: string; events?: { __typename?: string; type?: string; attrs?: Attribute[] }[] }
      messages?: { value?: Message }[]
    }[]
  }
  errors?: { message: string }[]
}

async function queryIndexer(query: string, variables: Record<string, string | number>): Promise<IndexerResponse> {
  const response = await fetch(TX_INDEXER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  })
  if (!response.ok) throw new Error(`The indexer answered ${response.status}`)

  const json = (await response.json()) as IndexerResponse
  if (json.errors?.length) throw new Error(json.errors.map((error) => error.message).join('; '))
  console.log('****************fetched', json)

  return json
}

// A transaction matches as a whole, so it carries every one of its messages and
// events, and a message the indexer cannot decode passes any MsgCall filter.
// Both arrive as something other than what was asked for.
function messageOf(transaction: { messages?: { value?: Message }[] }, boardId: number): Message | undefined {
  for (const message of transaction.messages || []) {
    const args = message.value?.args
    if (message.value?.__typename !== 'MsgCall' || !args) continue

    // A post ID is unique within its board, not across boards, so another
    // board's post of the same ID answers the same query. The realm takes the
    // board from the first argument.
    if (args[ARG_BOARD_ID] !== String(boardId)) continue

    return message.value
  }

  return undefined
}

// Return the IDs of every post of a thread that was deleted, whether the realm
// kept it with its body overwritten or removed it outright.
export async function fetchDeletedPostIds(boardId: number, threadId: number): Promise<number[]> {
  const json = await queryIndexer(DELETED_QUERY, { boardId: String(boardId), threadId: String(threadId) })

  const ids: number[] = []
  for (const transaction of json.data?.getTransactions || []) {
    for (const event of transaction.response?.events || []) {
      if (event.__typename !== 'GnoEvent' || event.type !== DELETED_EVENT) continue

      const attrs = new Map((event.attrs || []).map((attr) => [attr.key, attr.value]))
      // One transaction can delete posts of more than one thread, so check the
      // event itself and not only the transaction the filter matched.
      if (attrs.get('boardID') !== String(boardId) || attrs.get('threadID') !== String(threadId)) continue

      const id = Number(attrs.get('replyID'))
      if (id) ids.push(id)
    }
  }

  return ids
}

export type CreatedPost = {
  // The post this one answers, which is the thread itself when zero.
  parentId: number
  body: string
  creator: string
  // The block the post was created in. The time it was created is the time of
  // that block, which is a query of its own and not made yet.
  blockHeight: number
}

// A filter per post, since the indexer matches a response by equality and has
// no way to ask for one of several values.
function createdPostsQuery(count: number): string {
  const names = Array.from({ length: count }, (_, i) => `$data${i}`)
  return `query createdPosts(${names.map((name) => `${name}: String!`).join(', ')}) {
  getTransactions(
    where: {
      success: { eq: true }
      messages: { value: { MsgCall: { pkg_path: { eq: "${PACKAGE_PATH}" } func: { eq: "CreateReply" } } } }
      _or: [${names.map((name) => `{ response: { data: { eq: ${name} } } }`).join(', ')}]
    }
  ) {
    block_height
    response {
      data
    }
    messages {
      value {
        __typename
        ... on MsgCall {
          caller
          args
        }
      }
    }
  }
}`
}

// Return what each of these posts was created with, keyed by post ID. A post
// whose creating transaction cannot be found is left out.
export async function fetchCreatedPosts(boardId: number, postIds: number[]): Promise<Map<number, CreatedPost>> {
  const posts = new Map<number, CreatedPost>()
  if (postIds.length === 0) return posts

  const variables: Record<string, string> = {}
  postIds.forEach((postId, i) => (variables[`data${i}`] = callResult(postId)))
  const json = await queryIndexer(createdPostsQuery(postIds.length), variables)

  for (const transaction of json.data?.getTransactions || []) {
    const message = messageOf(transaction, boardId)
    if (!message) continue

    // Which post this created, taken from the response the filter matched on
    // rather than assumed from the order the transactions come back in.
    const id = Number(transaction.response?.data?.match(callResultId)?.[1])
    if (!id || posts.has(id)) continue

    const args = message.args as string[]
    posts.set(id, {
      parentId: Number(args[ARG_PARENT_ID]),
      body: args[ARG_BODY],
      creator: message.caller || '',
      blockHeight: transaction.block_height || 0
    })
  }

  return posts
}

// A filter per block, as for the posts above, since a height can only be asked
// for by equality.
function blockTimesQuery(count: number): string {
  const names = Array.from({ length: count }, (_, i) => `$height${i}`)
  return `query blockTimes(${names.map((name) => `${name}: Int!`).join(', ')}) {
  getBlocks(where: { _or: [${names.map((name) => `{ height: { eq: ${name} } }`).join(', ')}] }) {
    height
    time
  }
}`
}

// Return the time each of these blocks was created, keyed by height. The realm
// dates a post by the time of the block it was created in, so this is the date
// of a post whose own is no longer on chain.
export async function fetchBlockTimes(heights: number[]): Promise<Map<number, string>> {
  const times = new Map<number, string>()
  const wanted = [...new Set(heights.filter((height) => height > 0))]
  if (wanted.length === 0) return times

  const variables: Record<string, number> = {}
  wanted.forEach((height, i) => (variables[`height${i}`] = height))
  const json = await queryIndexer(blockTimesQuery(wanted.length), variables)

  for (const block of json.data?.getBlocks || []) {
    if (block.height === undefined || !block.time) continue
    // The indexer dates a block to the nanosecond, while the rest of the app
    // works in the milliseconds of a JavaScript date.
    times.set(block.height, block.time.replace(/(\.\d{3})\d+/, '$1'))
  }

  return times
}

// Return the body a deleted post was created with, or undefined when the
// transaction that created it cannot be found.
export async function fetchOriginalBody(boardId: number, postId: number): Promise<string | undefined> {
  const posts = await fetchCreatedPosts(boardId, [postId])
  return posts.get(postId)?.body
}
