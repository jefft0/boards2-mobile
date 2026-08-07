import { createAppAsyncThunk } from '../utils/async-thunk'
import { UserCacheApi } from '@gno/hooks/use-user-cache'
import { Post } from '@gno/types'
import { GnoNativeApi } from '@gnolang/gnonative'
import { createSlice } from '@reduxjs/toolkit'
import { ThunkExtra, Board } from '@gno/redux'
import { countThreadPosts, fetchThreadPosts, subtractOrZero } from '@gno/redux'

interface ThreadsState {
  threads: Post[]
  board?: Board
  loading: boolean
  error?: string
  totalPosts?: number
  startIndex?: number
  endIndex?: number
}

const initialState = {
  threads: [] as Post[],
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
      state.threads = action.payload?.posts || []
      state.totalPosts = action.payload?.totalPosts || 0
    })
    builder.addCase(loadThreads.pending, (state) => {
      state.threads = []
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
    selectThreads: (state: ThreadsState) => state.threads,
    selectThreadLoading: (state: ThreadsState) => state.loading,
    // Thread IDs restart on every board, so the board is part of the identity.
    selectThreadById: (state: ThreadsState, boardId: number | string, id: number | string) =>
      state.threads.find((thread) => thread.boardId === Number(boardId) && thread.id === Number(id))
  }
})

export const { selectThreads, selectThreadLoading, selectThreadBoard, selectThreadById } = threadsSlice.selectors

type LoadResult = {
  board: Board
  totalPosts: number
  posts: Post[]
  n_posts: number
}

type LoadThreadsRequest = {
  board: Board
}

export const loadThreads = createAppAsyncThunk<LoadResult | undefined, LoadThreadsRequest, ThunkExtra>(
  'threads/loadThreads',
  async ({ board }, thunkAPI) => {
    const gnonative = thunkAPI.extra.gnonative as GnoNativeApi
    const userCache = thunkAPI.extra.userCache as UserCacheApi

    try {
      const totalPosts = await countThreadPosts(userCache, gnonative, board.id)
      const startIndex = subtractOrZero(totalPosts, PAGE_SIZE)

      const postsRes = await fetchThreadPosts(userCache, gnonative, board.id, startIndex, totalPosts)

      return {
        board,
        totalPosts,
        posts: postsRes.data,
        n_posts: postsRes.n_posts
      }
    } catch (error) {
      console.error('error in loadThreads thunk:', error)
      throw error
    }
  }
)
