import { PACKAGE_PATH } from '@gno/constants/Constants'
import { UserCacheApi } from '@gno/hooks/use-user-cache'
import { ParentPost, Post, User } from '@gno/types'
import { GnoNativeApi } from '@gnolang/gnonative'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ThunkExtra, Board } from '@gno/redux'

interface ThreadsState {
  feed: Post[]
  board?: Board
  loading: boolean
  error?: string
  totalPosts?: number
  startIndex?: number
  endIndex?: number
}

const initialState = {
  feed: [] as Post[],
  board: undefined,
  loading: false,
  error: undefined,
  count: undefined,
  startIndex: undefined,
  endIndex: undefined
} as ThreadsState

const PAGE_SIZE = 9

export const threadsSlice = createSlice({
  name: 'threads',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(loadThreads.fulfilled, (state, action) => {
      state.board = action.payload?.board
      state.loading = false
      state.feed = action.payload?.feed || []
      state.totalPosts = action.payload?.totalPosts || 0
    })
    builder.addCase(loadThreads.pending, (state) => {
      state.loading = true
      state.error = undefined
    })
    builder.addCase(loadThreads.rejected, (state, action) => {
      state.loading = false
      state.error = action.error.message
    })
  },
  selectors: {
    selectThreadBoard: (state: ThreadsState) => state.board,
    selectThreads: (state: ThreadsState) => state.feed,
    selectThreadLoading: (state: ThreadsState) => state.loading
  }
})

export const {} = threadsSlice.actions

export const { selectThreads, selectThreadLoading, selectThreadBoard } = threadsSlice.selectors

type LoadResult = {
  board: Board
  totalPosts: number
  feed: Post[]
  n_posts: number
}

type LoadThreadsRequest = {
  board: Board
}

export const loadThreads = createAsyncThunk<LoadResult | undefined, LoadThreadsRequest, ThunkExtra>(
  'threads/loadThreads',
  async ({ board }, thunkAPI) => {
    const gnonative = thunkAPI.extra.gnonative as GnoNativeApi
    const userCache = thunkAPI.extra.userCache as UserCacheApi

    try {
      const totalPosts = await countThreadPosts(userCache, gnonative, board.id)

      const startIndex = subtractOrZero(totalPosts, PAGE_SIZE)
      const { data, n_posts } = await fetchThreadPosts(userCache, gnonative, board.id, startIndex, totalPosts)

      return {
        board,
        totalPosts,
        feed: data,
        n_posts
      }
    } catch (error) {
      console.error('error in loadFeed thunk:', error)
      throw error
    }
  }
)

async function fetchThreadPosts(
  userCache: UserCacheApi,
  gnonative: GnoNativeApi,
  boardId: number,
  startIndex: number,
  endIndex: number
): Promise<ThreadPosts> {
  const result = await qEvalGetPosts(gnonative, boardId, 0, 0, startIndex, endIndex)
  const json = await enrichData(userCache, gnonative, result)
  return json
}

async function countThreadPosts(userCache: UserCacheApi, gnonative: GnoNativeApi, boardId: number): Promise<number> {
  const result = await qEvalGetPosts(gnonative, boardId, 0, 0, 0, 0)
  const { n_posts } = await enrichData(userCache, gnonative, result)
  return n_posts
}

const subtractOrZero = (a: number, b: number) => Math.max(0, a - b)

async function qEvalGetPosts(
  gnonative: GnoNativeApi,
  boardId: number,
  threadId: number,
  postId: number,
  startIndex: number,
  endIndex: number
): Promise<string> {
  const postInfos = await gnonative.qEval(PACKAGE_PATH, `GetPosts(${boardId},${threadId},${postId},${startIndex},${endIndex})`)
  const totalRegex = /^\((\d+) int\)/g
  const totalMatch = totalRegex.exec(postInfos)
  if (!totalMatch) throw new Error("Can't find total in GetPosts response")
  const total = Number(totalMatch![1])

  const postRegex =
    /\(struct{\((\d+) gno.land\/r\/gnoland\/boards2\/v1.PostID\),\((\d+) gno.land\/r\/gnoland\/boards2\/v1.BoardID\),\("(\w+)" .uverse.address\),\("([^"]*)" string\),\("([^"]*)" string\),\((\w+) bool\),\((\w+) bool\),\((\d+) gno.land\/r\/gnoland\/boards2\/v1.PostID\),\((\d+) gno.land\/r\/gnoland\/boards2\/v1.PostID\),\((\d+) gno.land\/r\/gnoland\/boards2\/v1.BoardID\),\((\d+) int\),\((\d+) int\),\((\d+) int\),\("([^"]+)" string\)} gno.land\/r\/gnoland\/boards2\/v1.PostInfo\)/g
  let posts = []
  let index = 0
  let match
  while ((match = postRegex.exec(postInfos)) !== null) {
    const postId = Number(match[1])
    const boardId = Number(match[2])
    const createdAt = match[14]
    const creator = match[3]
    const n_replies = Number(match[11])
    const n_replies_all = Number(match[12])
    const thread_id = Number(match[8])
    const parent_id = Number(match[9])
    const hidden = match[6] === 'true'
    let title = match[4]
    let body = match[5]
    if (hidden) {
      if (parent_id === 0)
        // Don't show hidden threads
        continue
      else title = '⚠ Reply is hidden as it has been flagged as inappropriate'
      body = title
    }
    posts.push({
      index,
      post: { id: postId, boardId, createdAt, creator, n_gnods: 0, n_replies, n_replies_all, thread_id, parent_id, title, body }
    })
    ++index
  }

  let data = { n_threads: total, posts: posts }
  return '(' + JSON.stringify(JSON.stringify(data)) + ' string)'
}

async function enrichData(userCache: UserCacheApi, gnonative: GnoNativeApi, result: string, nHomePosts?: number) {
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
    boardId: jsonPost.boardId,
    createdAt: jsonPost.createdAt,
    title: jsonPost.title,
    body: jsonPost.body,
    n_replies: jsonPost.n_replies,
    n_gnods: jsonPost.n_gnods,
    n_replies_all: jsonPost.n_replies_all,
    thread_id: jsonPost.thread_id,
    parent_id: jsonPost.parent_id,
    repost_parent
  }

  return post
}

interface ThreadPosts {
  data: Post[]
  n_posts: number
}
