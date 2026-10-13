import { DELETED_POST_BODY, PACKAGE_PATH } from '@gno/constants/Constants'
import { CreatedPost, fetchBlockTimes, fetchCreatedPosts, fetchDeletedPostIds } from '@gno/utils/indexer'
import { gnoValuesToObject } from '../features/boardsSlice'
import { UserCacheApi } from '@gno/hooks/use-user-cache'
import { Comment, Post, ThreadComments, ThreadPosts, User } from '@gno/types'
import { GnoNativeApi } from '@gnolang/gnonative'

export const subtractOrZero = (a: number, b: number) => Math.max(0, a - b)
// The capture groups follow the fields of hubexts.Thread.
export const threadRegex =
  /\(struct{\((\d+) uint64\),\((\d+) uint64\),\((\d+) uint64\),\((\d+) uint64\),\("([^"]*)" string\),\("([^"]*)" string\),\((\w+) bool\),\((\w+) bool\),\((\d+) int\),\((\d+) int\),\((\d+) int\),\("(\w+)" \.uverse\.address\),\((\d+) int64\),\((\d+) int64\)} gno\.land\/p\/\w+\/boards\/exts\/hub\/v0\.Thread\)/
// The capture groups follow the fields of hubexts.Comment.
export const commentRegex =
  /\(struct{\((\d+) uint64\),\((\d+) uint64\),\((\d+) uint64\),\((\d+) uint64\),\("([^"]*)" string\),\((\w+) bool\),\((\d+) int\),\((\d+) int\),\("(\w+)" \.uverse\.address\),\((\d+) int64\),\((\d+) int64\)} gno\.land\/p\/\w+\/boards\/exts\/hub\/v0\.Comment\)/

// Return the user's top-level posts. (Like render args "board".)
export async function fetchThreadPosts(
  userCache: UserCacheApi,
  gnonative: GnoNativeApi,
  boardId: number,
  startIndex: number,
  endIndex: number
): Promise<ThreadPosts> {
  const result = await qEvalGetPosts(gnonative, boardId, startIndex, endIndex)
  const json = await enrichData(userCache, result)
  return { ...json, data: await addRepostOriginals(userCache, gnonative, json.data) }
}

// A repost's own title and body are usually empty, so attach the thread it was
// reposted from as repost_parent and let the caller show that summary instead.
async function addRepostOriginals(userCache: UserCacheApi, gnonative: GnoNativeApi, posts: Post[]): Promise<Post[]> {
  const keyOf = (post: Post) => `${post.originalBoardId}/${post.originalThreadId}`
  const reposts = posts.filter((post) => post.originalBoardId)
  if (reposts.length === 0) return posts

  // Fetch each original once, however many reposts of it the page holds, and all
  // of them at the same time: one page can hold a screenful of reposts.
  const keys = [...new Set(reposts.map(keyOf))]
  const fetched = await Promise.all(
    keys.map((key) => {
      const [originalBoardId, originalThreadId] = key.split('/').map(Number)
      return fetchThread(userCache, gnonative, originalBoardId, originalThreadId)
    })
  )
  const originals = new Map(keys.map((key, i) => [key, fetched[i]]))

  return posts.map((post) => (post.originalBoardId ? { ...post, repost_parent: originals.get(keyOf(post)) } : post))
}

// Return a single top-level post, or undefined if the board or thread is gone.
export async function fetchThread(
  userCache: UserCacheApi,
  gnonative: GnoNativeApi,
  boardId: number,
  threadId: number
): Promise<Post | undefined> {
  const thread = await qEvalGetThread(gnonative, boardId, threadId)
  if (!thread) return undefined

  const post = convertToPost(thread, await userCache.getUser(thread.creator))
  if (!post.originalBoardId) return post

  // The realm refuses to repost a repost, so this recurses only once.
  return {
    ...post,
    repost_parent: await fetchThread(userCache, gnonative, post.originalBoardId, post.originalThreadId)
  }
}

// Return the top level comments of a specific thread. `total` is the thread's
// comment count, which the caller already read from the thread it fetched.
export async function fetchThreadComments(
  userCache: UserCacheApi,
  gnonative: GnoNativeApi,
  boardId: number,
  threadId: number,
  startIndex: number,
  endIndex: number,
  total: number
): Promise<ThreadComments> {
  const result = await qEvalGetComments(gnonative, boardId, threadId, startIndex, endIndex, total)
  return await enrichComments(userCache, result)
}

// Return the direct replies of a comment or reply. `total` is the reply count of
// the comment the caller fetched.
export async function fetchCommentReplies(
  userCache: UserCacheApi,
  gnonative: GnoNativeApi,
  boardId: number,
  threadId: number,
  commentId: number,
  startIndex: number,
  endIndex: number,
  total: number
): Promise<ThreadComments> {
  const result = await qEvalGetReplies(gnonative, boardId, threadId, commentId, startIndex, endIndex, total)
  return await enrichComments(userCache, result)
}

// Return a single comment or reply, or undefined if it is gone.
export async function fetchComment(
  userCache: UserCacheApi,
  gnonative: GnoNativeApi,
  boardId: number,
  threadId: number,
  commentId: number
): Promise<Comment | undefined> {
  const comment = await qEvalGetComment(gnonative, boardId, threadId, commentId)
  if (!comment) return undefined

  return convertToComment(comment, await userCache.getUser(comment.creator))
}

// Build the post a post the realm deleted outright was, from what the indexer
// holds of it. Such a post had no replies, so it is a leaf and nothing of the
// thread below it is missing. Only the date it was last updated is beyond
// reach, being a date the realm wrote and dropped.
async function toDeletedComment(
  userCache: UserCacheApi,
  boardId: number,
  threadId: number,
  id: number,
  post: CreatedPost,
  createdAt?: string
): Promise<Comment> {
  return {
    user: await userCache.getUser(post.creator),
    id,
    boardId,
    threadId,
    // A post created as a reply to the thread itself has a parent of zero,
    // while the app gives such a comment the thread as its parent.
    parentId: post.parentId || threadId,
    body: DELETED_POST_BODY,
    hidden: false,
    // Which tells this apart from a post the realm soft deleted, whose body it
    // overwrote with the same text but which it still holds and still answers.
    missing: true,
    n_replies: 0,
    n_flags: 0,
    createdAt: createdAt || '',
    updatedAt: ''
  }
}

// Return the post the realm deleted outright under this ID, or undefined when
// the indexer has no transaction creating it. The realm keeps nothing of such a
// post, so a screen showing one has nothing to show without this.
//
// TODO: This asks the indexer whether a post was ever created under this ID,
// not whether it was deleted, and takes the deletion from the realm having
// nothing to return. That holds while only a deleted post goes missing. Read
// the ReplyDeleted events as well, as addDeletedPosts does, to tell a deletion
// from a post the realm withholds for another reason.
export async function fetchDeletedPost(
  userCache: UserCacheApi,
  boardId: number,
  threadId: number,
  postId: number
): Promise<Comment | undefined> {
  try {
    const post = (await fetchCreatedPosts(boardId, [postId])).get(postId)
    if (!post) return undefined

    const times = await fetchBlockTimes([post.blockHeight])
    return await toDeletedComment(userCache, boardId, threadId, postId, post, times.get(post.blockHeight))
  } catch (error) {
    // Not an error: the screen shows what the realm holds either way, and the
    // indexer serves only the chain it was hardwired for.
    console.log('No deleted post', postId, 'of thread', threadId, '—', error)
    return undefined
  }
}

// Add a post for each one of this list the realm deleted outright, which it
// does for a deleted post with no replies, so that a reader sees that something
// was there. The realm keeps no trace of such a post, so both the fact of the
// deletion and what the post held come from the indexer.
//
// `parentId` is the post the list answers: the thread for its top level
// comments, or the comment or reply whose replies these are. `coversWholeList`
// tells whether the page holds every post of the list.
export async function addDeletedPosts(
  userCache: UserCacheApi,
  boardId: number,
  threadId: number,
  parentId: number,
  comments: Comment[],
  coversWholeList: boolean
): Promise<Comment[]> {
  try {
    const deletedIds = await fetchDeletedPostIds(boardId, threadId)
    // A soft deleted post is still on chain and already in the list, so only
    // the ones missing from it were deleted outright.
    const present = new Set(comments.map((comment) => comment.id))
    let missing = deletedIds.filter((id) => !present.has(id))

    if (!coversWholeList) {
      // A post missing from a page of a longer list may just be on another
      // page, so only fill the gaps inside the range this page covers.
      if (comments.length === 0) return comments
      const ids = comments.map((comment) => comment.id)
      const first = Math.min(...ids)
      const last = Math.max(...ids)
      missing = missing.filter((id) => id > first && id < last)
    }
    if (missing.length === 0) return comments

    const created = await fetchCreatedPosts(boardId, missing)
    const own: { id: number; post: CreatedPost }[] = []
    for (const id of missing) {
      const post = created.get(id)
      // The deletions cover the whole thread, so keep the ones this list owns.
      // A post created as a reply to the thread itself has a parent of zero.
      if (!post || (post.parentId || threadId) !== parentId) continue
      own.push({ id, post })
    }
    if (own.length === 0) return comments

    // The transaction that created a post does not hold the date it was given,
    // which is the time of the block it is in, so ask for those blocks. All of
    // them at once: a thread can have lost more than one post.
    const times = await fetchBlockTimes(own.map(({ post }) => post.blockHeight))

    const deleted: Comment[] = []
    for (const { id, post } of own) {
      deleted.push(await toDeletedComment(userCache, boardId, threadId, id, post, times.get(post.blockHeight)))
    }

    // The realm hands out IDs in order, so sorting by ID puts each post back
    // where it was, newest first as the rest of the list is.
    return [...comments, ...deleted].sort((a, b) => b.id - a.id)
  } catch (error) {
    // Not an error worth failing the screen for: the posts the realm still
    // holds are shown either way, and the indexer is reachable on its own
    // schedule. It also serves only the chain it was hardwired for.
    console.log('No deleted posts for thread', threadId, '—', error)
    return comments
  }
}

export async function countThreadPosts(gnonative: GnoNativeApi, boardId: number): Promise<number> {
  // Get the count from GetBoard, the same as done in qEvalGetPosts.
  const boardJSON = await gnonative.qEvalJSONValues(PACKAGE_PATH, `GetBoard(${boardId})`)
  const board = await gnoValuesToObject(boardJSON.results[0].fields)
  return Number(board.threadCount)
}

// Return a single thread, or undefined if the board or thread doesn't exist.
export async function qEvalGetThread(gnonative: GnoNativeApi, boardId: number, threadId: number) {
  const threadJSON = await gnonative.qEvalJSONValues(PACKAGE_PATH, `GetThread(${boardId},${threadId})`)
  const thread = await gnoValuesToObject(threadJSON.results[0].fields)

  const id = thread.id
  const originalBoardId = thread.originalBoardID
  const originalThreadId = thread.originalThreadID
  const threadBoardId = thread.boardID
  const title = thread.title
  const body = thread.body
  const hidden = thread.hidden
  const readOnly = thread.readonly
  const n_replies = thread.commentCount
  const n_reposts = thread.repostCount
  const creator = thread.creator
  const createdAtUnix = thread.createdAt
  const createdAt = new Date(createdAtUnix * 1000).toISOString()
  const updatedAtUnix = thread.updatedAt
  const updatedAt = new Date(updatedAtUnix * 1000).toISOString()
  return {
    id,
    originalBoardId,
    originalThreadId,
    boardId: threadBoardId,
    title,
    body,
    hidden,
    readOnly,
    n_replies,
    n_reposts,
    n_gnods: 0,
    creator,
    createdAt,
    updatedAt
  }
}

export async function qEvalGetPosts(
  gnonative: GnoNativeApi,
  boardId: number,
  startIndex: number,
  endIndex: number
): Promise<string> {
  const threadInfos = await gnonative.qEvalJSONValues(
    PACKAGE_PATH,
    `GetThreads(${boardId},${startIndex},${endIndex - startIndex})`
  )
  const total = countThreadPosts(gnonative, boardId)

  let posts = []
  let index = 0
  for (const threadJSON of threadInfos.results[0].elems) {
    const thread = await gnoValuesToObject(threadJSON.fields)
    const id = thread.id
    const originalBoardId = thread.originalBoardID
    const originalThreadId = thread.originalThreadID
    const boardId = thread.boardID
    const title = thread.title
    const body = thread.body
    const hidden = thread.hidden
    const readOnly = thread.readonly
    const n_replies = thread.commentCount
    const n_reposts = thread.repostCount
    const creator = thread.creator
    const createdAtUnix = thread.createdAt
    const createdAt = new Date(createdAtUnix * 1000).toISOString()
    const updatedAtUnix = thread.updatedAt
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
        n_reposts,
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
  endIndex: number,
  total: number
): Promise<string> {
  const commentInfos = await gnonative.qEval(
    PACKAGE_PATH,
    `GetComments(${boardId},${threadId},${startIndex},${endIndex - startIndex})`
  )

  return encodeComments(total, parseComments(commentInfos))
}

// Return the direct replies of a comment or reply. `commentId` can be the ID of
// a top level comment or of a nested reply.
export async function qEvalGetReplies(
  gnonative: GnoNativeApi,
  boardId: number,
  threadId: number,
  commentId: number,
  startIndex: number,
  endIndex: number,
  total: number
): Promise<string> {
  const replyInfos = await gnonative.qEval(
    PACKAGE_PATH,
    `GetReplies(${boardId},${threadId},${commentId},${startIndex},${endIndex - startIndex})`
  )

  return encodeComments(total, parseComments(replyInfos))
}

// Return a single comment or reply, or undefined if it doesn't exist.
export async function qEvalGetComment(gnonative: GnoNativeApi, boardId: number, threadId: number, commentId: number) {
  const commentInfo = await gnonative.qEval(PACKAGE_PATH, `GetComment(${boardId},${threadId},${commentId})`)
  const match = commentRegex.exec(commentInfo)
  if (!match) return undefined

  return parseComment(match)
}

// Parse every comment in a GetComments or GetReplies response.
function parseComments(commentInfos: string) {
  const commentListRegex = new RegExp(commentRegex.source, 'g')
  let comments = []
  let match
  while ((match = commentListRegex.exec(commentInfos)) !== null) {
    comments.push(parseComment(match))
  }

  return comments
}

function parseComment(match: RegExpExecArray) {
  const createdAtUnix = Number(match[10])
  const updatedAtUnix = Number(match[11])
  return {
    id: Number(match[1]),
    boardId: Number(match[2]),
    threadId: Number(match[3]),
    parentId: Number(match[4]),
    body: match[5],
    hidden: match[6] === 'true',
    n_replies: Number(match[7]),
    n_flags: Number(match[8]),
    creator: match[9],
    createdAt: new Date(createdAtUnix * 1000).toISOString(),
    updatedAt: new Date(updatedAtUnix * 1000).toISOString()
  }
}

// Encode comments the way enrichComments decodes them.
function encodeComments(total: number, comments: ReturnType<typeof parseComment>[]) {
  const data = { n_comments: total, comments }
  return '(' + JSON.stringify(JSON.stringify(data)) + ' string)'
}

export async function enrichData(userCache: UserCacheApi, result: string): Promise<ThreadPosts> {
  const jsonResult = toJson<GetPostsJson>(result)
  const posts: Post[] = []

  for (const jsonPost of jsonResult.posts) {
    const post = jsonPost.post
    const creator = await userCache.getUser(post.creator)
    posts.push(convertToPost(post, creator))
  }

  return {
    data: posts.reverse(),
    n_posts: jsonResult.n_threads
  }
}

// The Comment counterpart of enrichData. A Comment is never a repost, so this
// only has to attach the creator of each comment.
export async function enrichComments(userCache: UserCacheApi, result: string): Promise<ThreadComments> {
  const jsonResult = toJson<GetCommentsJson>(result)
  const comments: Comment[] = []

  for (const jsonComment of jsonResult.comments) {
    const creator = await userCache.getUser(jsonComment.creator)
    comments.push(convertToComment(jsonComment, creator))
  }

  return {
    data: comments.reverse(),
    n_posts: jsonResult.n_comments
  }
}

// The JSON that qEvalGetPosts encodes and enrichData decodes.
type GetPostsJson = {
  n_threads: number
  posts: { index: number; post: any }[]
}

// The JSON that qEvalGetComments encodes and enrichComments decodes.
type GetCommentsJson = {
  n_comments: number
  comments: any[]
}

const toJson = <T = any>(data?: string): T => {
  if (!data || !(data.startsWith('(') && data.endsWith(' string)'))) throw new Error('Malformed GetPosts response')
  const quoted = data.substring(1, data.length - ' string)'.length)
  const json = JSON.parse(quoted)
  const jsonPosts = JSON.parse(json)

  return jsonPosts
}

function convertToPost(jsonPost: any, creator: User): Post {
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
    n_reposts: jsonPost.n_reposts,
    n_gnods: jsonPost.n_gnods,
    createdAt: jsonPost.createdAt,
    updatedAt: jsonPost.updatedAt
  }

  return post
}

function convertToComment(jsonComment: any, creator: User): Comment {
  const comment: Comment = {
    user: {
      name: creator.name,
      address: creator.address,
      avatar: creator.avatar,
      bech32: ''
    },
    id: jsonComment.id,
    boardId: jsonComment.boardId,
    threadId: jsonComment.threadId,
    parentId: jsonComment.parentId,
    body: jsonComment.body,
    hidden: jsonComment.hidden,
    n_replies: jsonComment.n_replies,
    n_flags: jsonComment.n_flags,
    createdAt: jsonComment.createdAt,
    updatedAt: jsonComment.updatedAt
  }

  return comment
}
