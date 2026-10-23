import { PACKAGE_PATH } from '@gno/constants/Constants'
import { gnoValuesToObject } from '@gno/redux'
import { UserCacheApi } from '@gno/hooks/use-user-cache'
import { Comment, Post, ThreadComments, ThreadPosts, User } from '@gno/types'
import { GnoValue, GnoNativeApi } from '@gnolang/gnonative'

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
  const threadInfos = await gnonative.qEvalJSONValues(PACKAGE_PATH, `GetThreads(${boardId},${startIndex},${endIndex - startIndex})`)
  const total = await countThreadPosts(gnonative, boardId)

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
  const commentInfos = await gnonative.qEvalJSONValues(
    PACKAGE_PATH,
    `GetComments(${boardId},${threadId},${startIndex},${endIndex - startIndex})`
  )

  return encodeComments(total, parseComments(commentInfos.results[0].elems))
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
  const replyInfos = await gnonative.qEvalJSONValues(
    PACKAGE_PATH,
    `GetReplies(${boardId},${threadId},${commentId},${startIndex},${endIndex - startIndex})`
  )

  return encodeComments(total, parseComments(replyInfos.results[0].elems))
}

// Return a single comment or reply, or undefined if it doesn't exist.
export async function qEvalGetComment(gnonative: GnoNativeApi, boardId: number, threadId: number, commentId: number) {
  try {
    const commentInfo = await gnonative.qEvalJSONValues(PACKAGE_PATH, `GetComment(${boardId},${threadId},${commentId})`)
    return parseComment(commentInfo.results[0].fields)
  } catch (error) {
    return undefined
  }
}

// Parse every comment in the "elems" array of a GetComments or GetReplies response.
function parseComments(commentInfos: GnoValue[]) {
  let comments = []
  for (const commentInfo of commentInfos) {
    comments.push(parseComment(commentInfo.fields))
  }

  return comments
}

// Return an object with the desired fields from a comment "fields" array
function parseComment(commentValues: GnoValue[]) {
  const comment = gnoValuesToObject(commentValues)
  const createdAtUnix = comment.createdAt
  const updatedAtUnix = comment.updatedAt
  return {
    id: comment.id,
    boardId: comment.boardID,
    threadId: comment.threadID,
    parentId: comment.parentID,
    body: comment.body,
    hidden: comment.hidden,
    n_replies: comment.replyCount,
    n_flags: comment.flagCount,
    creator: comment.creator,
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
