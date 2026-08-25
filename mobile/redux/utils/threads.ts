import { PACKAGE_PATH } from '@gno/constants/Constants'
import { boardRegex } from '../features/boardsSlice'
import { UserCacheApi } from '@gno/hooks/use-user-cache'
import { Comment, Post, ThreadComments, ThreadPosts, User } from '@gno/types'
import { GnoNativeApi } from '@gnolang/gnonative'

export const subtractOrZero = (a: number, b: number) => Math.max(0, a - b)
// The capture groups follow the fields of hubexts.Thread.
export const threadRegex =
  /\(struct{\((\d+) uint64\),\((\d+) uint64\),\((\d+) uint64\),\((\d+) uint64\),\("([^"]*)" string\),\("([^"]*)" string\),\((\w+) bool\),\((\w+) bool\),\((\d+) int\),\((\d+) int\),\((\d+) int\),\("(\w+)" \.uverse\.address\),\((\d+) int64\),\((\d+) int64\)} gno\.land\/p\/\w+\/boards\/exts\/hub\.Thread\)/
// The capture groups follow the fields of hubexts.Comment.
export const commentRegex =
  /\(struct{\((\d+) uint64\),\((\d+) uint64\),\((\d+) uint64\),\((\d+) uint64\),\("([^"]*)" string\),\((\w+) bool\),\((\d+) int\),\((\d+) int\),\("(\w+)" \.uverse\.address\),\((\d+) int64\),\((\d+) int64\)} gno\.land\/p\/\w+\/boards\/exts\/hub\.Comment\)/

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
  const originals = new Map<string, Post | undefined>()
  const result: Post[] = []

  for (const post of posts) {
    if (!post.originalBoardId) {
      result.push(post)
      continue
    }

    const key = `${post.originalBoardId}/${post.originalThreadId}`
    if (!originals.has(key)) {
      originals.set(key, await fetchThread(userCache, gnonative, post.originalBoardId, post.originalThreadId))
    }

    result.push({ ...post, repost_parent: originals.get(key) })
  }

  return result
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

// Return the top level comments of a specific thread.
export async function fetchThreadComments(
  userCache: UserCacheApi,
  gnonative: GnoNativeApi,
  boardId: number,
  threadId: number,
  startIndex: number,
  endIndex: number
): Promise<ThreadComments> {
  const result = await qEvalGetComments(gnonative, boardId, threadId, startIndex, endIndex)
  return await enrichComments(userCache, result)
}

// Return the direct replies of a comment or reply.
export async function fetchCommentReplies(
  userCache: UserCacheApi,
  gnonative: GnoNativeApi,
  boardId: number,
  threadId: number,
  commentId: number,
  startIndex: number,
  endIndex: number
): Promise<ThreadComments> {
  const result = await qEvalGetReplies(gnonative, boardId, threadId, commentId, startIndex, endIndex)
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
  const boardInfo = await gnonative.qEval(PACKAGE_PATH, `GetBoard(${boardId})`)
  const match = boardRegex.exec(boardInfo)
  if (!match) throw new Error("Can't find thread count in GetBoard response")
  return Number(match[4])
}

// Return a single thread, or undefined if the board or thread doesn't exist.
export async function qEvalGetThread(gnonative: GnoNativeApi, boardId: number, threadId: number) {
  const threadInfo = await gnonative.qEval(PACKAGE_PATH, `GetThread(${boardId},${threadId})`)
  const match = threadRegex.exec(threadInfo)
  if (!match) return undefined

  const id = Number(match[1])
  const originalBoardId = Number(match[2])
  const originalThreadId = Number(match[3])
  const threadBoardId = Number(match[4])
  const title = match[5]
  const body = match[6]
  const hidden = match[7] === 'true'
  const readOnly = match[8] === 'true'
  const n_replies = Number(match[9])
  const n_reposts = Number(match[10])
  const creator = match[12]
  const createdAtUnix = Number(match[13])
  const createdAt = new Date(createdAtUnix * 1000).toISOString()
  const updatedAtUnix = Number(match[14])
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
  const postInfos = await gnonative.qEval(PACKAGE_PATH, `GetThreads(${boardId},${startIndex},${endIndex - startIndex})`)
  const boardThreadCount = await gnonative.qEval(PACKAGE_PATH, `GetBoard(${boardId})`)
  const totalMatch = boardRegex.exec(boardThreadCount)
  if (!totalMatch) throw new Error("Can't find thread count in GetBoard response")
  const total = Number(totalMatch![4])

  const postRegex = new RegExp(threadRegex.source, 'g')
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
    const n_reposts = Number(match[10])
    const creator = match[12]
    const createdAtUnix = Number(match[13])
    const createdAt = new Date(createdAtUnix * 1000).toISOString()
    const updatedAtUnix = Number(match[14])
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
  endIndex: number
): Promise<string> {
  const commentInfos = await gnonative.qEval(
    PACKAGE_PATH,
    `GetComments(${boardId},${threadId},${startIndex},${endIndex - startIndex})`
  )
  const threadCommentCount = await gnonative.qEval(PACKAGE_PATH, `GetThread(${boardId},${threadId})`)
  const totalMatch = threadRegex.exec(threadCommentCount)
  if (!totalMatch) throw new Error("Can't find comment count in GetThread response")
  const total = Number(totalMatch![9])

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
  endIndex: number
): Promise<string> {
  const replyInfos = await gnonative.qEval(
    PACKAGE_PATH,
    `GetReplies(${boardId},${threadId},${commentId},${startIndex},${endIndex - startIndex})`
  )
  // Get the count from GetComment, the same as qEvalGetComments does with GetThread.
  const commentReplyCount = await gnonative.qEval(PACKAGE_PATH, `GetComment(${boardId},${threadId},${commentId})`)
  const totalMatch = commentRegex.exec(commentReplyCount)
  if (!totalMatch) throw new Error("Can't find reply count in GetComment response")
  const total = Number(totalMatch[7])

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
