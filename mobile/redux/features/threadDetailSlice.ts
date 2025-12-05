import { UserCacheApi } from '@gno/hooks/use-user-cache'
import { Post } from '@gno/types'
import { GnoNativeApi } from '@gnolang/gnonative'
import { createAsyncThunk, createSlice, RootState } from '@reduxjs/toolkit'
import { ThunkExtra, fetchThreadPostDetail, selectThreads, qEvalGetPosts, enrichData, subtractOrZero } from '@gno/redux'

interface ThreadDetailState {
  loading: boolean
  error?: string
  thread?: Post
  replies: Post[]
  totalPosts?: number
}

const initialState: ThreadDetailState = {
  loading: false,
  error: undefined,
  thread: undefined,
  replies: [],
  totalPosts: 0
}

const PAGE_SIZE = 20

export const threadDetailSlice = createSlice({
  name: 'threadDetail',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(loadThreadDetail.fulfilled, (state, action) => {
      state.loading = false
      state.error = undefined
      state.thread = action.payload?.thread
      state.replies = action.payload?.replies || []
      state.totalPosts = action.payload?.totalPosts || 0
    })
    builder.addCase(loadThreadDetail.pending, (state) => {
      state.loading = true
      state.error = undefined
      state.thread = undefined
      state.replies = []
      state.totalPosts = 0
    })
    builder.addCase(loadThreadDetail.rejected, (state, action) => {
      state.loading = false
      state.error = action.error.message
    })
  },
  selectors: {
    selectThreadDetail: (state: ThreadDetailState) => state.thread,
    selectThreadReplies: (state: ThreadDetailState) => state.replies,
    selectThreadDetailLoading: (state: ThreadDetailState) => state.loading
  }
})

export const { selectThreadReplies, selectThreadDetailLoading, selectThreadDetail } = threadDetailSlice.selectors

export type LoadThreadDetailRequest = {
  boardId: number
  threadId: number
}

export type LoadThreadDetailResult = {
  thread?: Post
  replies: Post[]
  totalPosts: number
}

export const loadThreadDetail = createAsyncThunk<LoadThreadDetailResult | undefined, LoadThreadDetailRequest, ThunkExtra>(
  'threadDetail/loadThreadDetail',
  async ({ boardId, threadId }, thunkAPI) => {
    const gnonative = thunkAPI.extra.gnonative as GnoNativeApi
    const userCache = thunkAPI.extra.userCache as UserCacheApi

    try {
      const threads = selectThreads(thunkAPI.getState() as RootState)
      const totalPosts = await countPosts(userCache, gnonative, boardId, threadId)
      const startIndex = subtractOrZero(totalPosts, PAGE_SIZE)

      const res = await fetchThreadPostDetail(userCache, gnonative, boardId, threadId, startIndex, totalPosts)

      return {
        thread: threads.find((t) => t.id === Number(threadId)),
        replies: res.data,
        totalPosts
      }
    } catch (error) {
      console.error('error in loadThreadDetail thunk:', error)
      throw error
    }
  }
)

async function countPosts(userCache: UserCacheApi, gnonative: GnoNativeApi, boardId: number, threadId: number): Promise<number> {
  const result = await qEvalGetPosts(gnonative, boardId, threadId, 0, 0, 0)
  const { n_posts } = await enrichData(userCache, gnonative, result)
  return n_posts
}
