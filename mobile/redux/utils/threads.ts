import { PACKAGE_PATH } from '@gno/constants/Constants'
import { UserCacheApi } from '@gno/hooks/use-user-cache'
import { ParentPost, Post, ThreadPosts, User } from '@gno/types'
import { GnoNativeApi } from '@gnolang/gnonative'

export const subtractOrZero = (a: number, b: number) => Math.max(0, a - b)

// Return the user's top-level posts. (Like render args "board".)
export async function fetchThreadPosts(
  userCache: UserCacheApi,
  gnonative: GnoNativeApi,
  boardId: number,
  startIndex: number,
  endIndex: number
): Promise<ThreadPosts> {
  const result = await qEvalGetPosts(gnonative, boardId, startIndex, endIndex)
  const json = await enrichData(userCache, gnonative, result)
  return json
}

// Return the "comment" posts in a specific thread.
export async function fetchThreadComments(
  userCache: UserCacheApi,
  gnonative: GnoNativeApi,
  boardId: number,
  threadId: number,
  startIndex: number,
  endIndex: number
): Promise<ThreadPosts> {
  const result = await qEvalGetComments(gnonative, boardId, threadId, startIndex, endIndex)
  const json = await enrichData(userCache, gnonative, result)
  return json
}

export async function countThreadPosts(userCache: UserCacheApi, gnonative: GnoNativeApi, boardId: number): Promise<number> {
  const result = await qEvalGetPosts(gnonative, boardId, 0, 0)
  const { n_posts } = await enrichData(userCache, gnonative, result)
  return n_posts
}

export async function qEvalGetPosts(
  gnonative: GnoNativeApi,
  boardId: number,
  startIndex: number,
  endIndex: number
): Promise<string> {
  const postInfos = await gnonative.qEval(PACKAGE_PATH, `GetThreads(${boardId},${startIndex},${endIndex - startIndex})`)
  const boardThreadCount = await gnonative.qEval(PACKAGE_PATH, `GetBoard(${boardId})`)
  const totalRegex =
    /\(struct{\(\d+ uint64\),\("[^"]+" string\),\(nil \[\]string\),\(\w+ bool\),\((\d+) int\),\(\d+ int\),\("\w+" \.uverse\.address\),\(\d+ int64\),\(\d+ int64\)} gno\.land\/p\/\w+\/boards\/exts\/hub\.Board\)/g
  const totalMatch = totalRegex.exec(boardThreadCount)
  if (!totalMatch) throw new Error("Can't find thread count in GetBoard response")
  const total = Number(totalMatch![1])

  const postRegex =
    /\(struct{\((\d+) uint64\),\((\d+) uint64\),\((\d+) uint64\),\((\d+) uint64\),\("([^"]*)" string\),\("([^"]*)" string\),\((\w+) bool\),\((\w+) bool\),\((\d+) int\),\(\d+ int\),\(\d+ int\),\("(\w+)" \.uverse\.address\),\((\d+) int64\),\((\d+) int64\)} gno\.land\/p\/\w+\/boards\/exts\/hub\.Thread\)/g
  let posts = []
  let index = 0
  let match
  while ((match = postRegex.exec(postInfos)) !== null) {
    const id = Number(match[1])
    const originalBoardId = Number(match[2])
    const originalThreadId = Number(match[3])
    const boardId = Number(match[4])
    const title = match[5]
    const body = match[6]
    const hidden = match[7] === 'true'
    const readOnly = match[8] === 'true'
    const n_replies = Number(match[9])
    const creator = match[10]
    const createdAtUnix = Number(match[11])
    const createdAt = new Date(createdAtUnix * 1000).toISOString()
    const updatedAtUnix = Number(match[12])
    const updatedAt = new Date(updatedAtUnix * 1000).toISOString()
    posts.push({
      index,
      post: {
        id,
        originalBoardId,
        originalThreadId,
        boardId,
        title,
        body,
        hidden,
        readOnly,
        n_replies,
        n_gnods: 0,
        creator,
        createdAt,
        updatedAt
      }
    })
    ++index
  }

  let data = { n_threads: total, posts: posts }
  return '(' + JSON.stringify(JSON.stringify(data)) + ' string)'
}

export async function qEvalGetComments(
  gnonative: GnoNativeApi,
  boardId: number,
  threadId: number,
  startIndex: number,
  endIndex: number
): Promise<string> {
  const commentInfos = await gnonative.qEval(
    PACKAGE_PATH,
    `GetComments(${boardId},${threadId},${startIndex},${endIndex - startIndex})`
  )
  const threadCommentCount = await gnonative.qEval(PACKAGE_PATH, `GetThread(${boardId},${threadId})`)
  const totalRegex =
    /\(struct{\(\d+ uint64\),\(\d+ uint64\),\(\d+ uint64\),\(\d+ uint64\),\("[^"]+" string\),\("[^"]+" string\),\(\w+ bool\),\(\w+ bool\),\((\d+) int\),\(\d+ int\),\(\d+ int\),\("\w+" \.uverse\.address\),\(\d+ int64\),\(\d+ int64\)} gno\.land\/p\/\w+\/boards\/exts\/hub\.Thread\)/g
  const totalMatch = totalRegex.exec(threadCommentCount)
  if (!totalMatch) throw new Error("Can't find comment count in GetThread response")
  const total = Number(totalMatch![1])

  const commentRegex =
    /\(struct{\((\d+) uint64\),\((\d+) uint64\),\((\d+) uint64\),\((\d+) uint64\),\("([^"]*)" string\),\((\w+) bool\),\((\d+) int\),\(\d+ int\),\("(\w+)" \.uverse\.address\),\((\d+) int64\),\((\d+) int64\)} gno\.land\/p\/\w+\/boards\/exts\/hub\.Comment\)/g
  let comments = []
  let index = 0
  let match
  while ((match = commentRegex.exec(commentInfos)) !== null) {
    const id = Number(match[1])
    const boardId = Number(match[2])
    const originalThreadId = Number(match[3])
    const originalBoardId = Number(match[4])
    const title = ''
    const body = match[5]
    const hidden = match[6] === 'true'
    const readOnly = false
    const n_replies = Number(match[7])
    const creator = match[8]
    const createdAtUnix = Number(match[9])
    const createdAt = new Date(createdAtUnix * 1000).toISOString()
    const updatedAtUnix = Number(match[10])
    const updatedAt = new Date(updatedAtUnix * 1000).toISOString()
    comments.push({
      index,
      post: {
        id,
        originalBoardId,
        originalThreadId,
        boardId,
        title,
        body,
        hidden,
        readOnly,
        n_replies,
        n_gnods: 0,
        creator,
        createdAt,
        updatedAt
      }
    })
    ++index
  }

  let data = { n_threads: total, posts: comments }
  return '(' + JSON.stringify(JSON.stringify(data)) + ' string)'
}

export async function enrichData(userCache: UserCacheApi, gnonative: GnoNativeApi, result: string, nHomePosts?: number) {
  const jsonResult = toJson(result)
  // If isThread then jsonResult is {n_threads: number, posts: array<{index: number, post: Post}>} from GetPosts.
  const isThread = 'n_threads' in jsonResult
  const jsonPosts = isThread ? jsonResult.posts : jsonResult
  const n_posts = isThread ? jsonResult.n_threads : nHomePosts

  const posts: Post[] = []

  for (const jsonPost of jsonPosts) {
    const post = isThread ? jsonPost.post : jsonPost
    const creator = await userCache.getUser(post.creator)

    let repost_parent: Post | undefined

    if (post.repost_user && post.parent_id) {
      const parent_user = await userCache.getUser(post.repost_user as string)
      const repost = await fetchParentPost(gnonative, post.parent_id, post.repost_user as string)
      repost_parent = convertToPost(repost, parent_user)
    }

    posts.push(convertToPost(post, creator, repost_parent))
  }

  return {
    data: posts.reverse(),
    n_posts
  }
}

const toJson = (data?: string) => {
  if (!data || !(data.startsWith('(') && data.endsWith(' string)'))) throw new Error('Malformed GetPosts response')
  const quoted = data.substring(1, data.length - ' string)'.length)
  const json = JSON.parse(quoted)
  const jsonPosts = JSON.parse(json)

  return jsonPosts
}

async function fetchParentPost(gnonative: GnoNativeApi, postId: number, address: string) {
  const payload = `[]UserAndPostID{{\"${address}\", ${postId}},}`
  const result = await gnonative.qEval('gno.land/r/berty/social', `GetJsonTopPostsByID(${payload})`)
  const jsonResult = toJson(result)
  return jsonResult[0]
}

function convertToPost(jsonPost: any, creator: User, repost_parent?: ParentPost): Post {
  const post: Post = {
    user: {
      name: creator.name,
      address: creator.address,
      avatar: creator.avatar,
      bech32: ''
    },
    id: jsonPost.id,
    originalBoardId: jsonPost.originalBoardId,
    originalThreadId: jsonPost.originalThreadId,
    boardId: jsonPost.boardId,
    title: jsonPost.title,
    body: jsonPost.body,
    hidden: jsonPost.hidden,
    readOnly: jsonPost.readOnly,
    n_replies: jsonPost.n_replies,
    n_gnods: jsonPost.n_gnods,
    createdAt: jsonPost.createdAt,
    updatedAt: jsonPost.updatedAt,
    repost_parent
  }

  return post
}
