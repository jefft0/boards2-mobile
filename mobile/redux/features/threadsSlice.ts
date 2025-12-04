import { UserCacheApi } from '@gno/hooks/use-user-cache'
import { Post } from '@gno/types'
import { GnoNativeApi } from '@gnolang/gnonative'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ThunkExtra, Board, RootState, selectAccount } from '@gno/redux'
import { countThreadPosts, fetchThreadPosts, subtractOrZero } from '@gno/redux'

interface ThreadsState {
  threads: Post[]
  board?: Board
  loading: boolean
  error?: string
  totalPosts?: number
  startIndex?: number
  endIndex?: number
  canCreate: boolean
}

const initialState = {
  threads: [] as Post[],
  board: undefined,
  loading: false,
  error: undefined,
  count: undefined,
  startIndex: undefined,
  endIndex: undefined,
  canCreate: false
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
      state.threads = action.payload?.feed || []
      state.totalPosts = action.payload?.totalPosts || 0
      state.canCreate = action.payload?.canCreate || false
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
    selectThreads: (state: ThreadsState) => state.threads,
    selectThreadLoading: (state: ThreadsState) => state.loading,
    selectCanCreateThread: (state: ThreadsState) => state.canCreate
  }
})

// export const {} = threadsSlice.actions

export const { selectThreads, selectThreadLoading, selectThreadBoard, selectCanCreateThread } = threadsSlice.selectors

type LoadResult = {
  board: Board
  totalPosts: number
  feed: Post[]
  n_posts: number
  canCreate: boolean
}

type LoadThreadsRequest = {
  board: Board
}

export const loadThreads = createAsyncThunk<LoadResult | undefined, LoadThreadsRequest, ThunkExtra>(
  'threads/loadThreads',
  async ({ board }, thunkAPI) => {
    const gnonative = thunkAPI.extra.gnonative as GnoNativeApi
    const userCache = thunkAPI.extra.userCache as UserCacheApi
    const address = selectAccount(thunkAPI.getState() as RootState)?.bech32 as string

    try {
      const totalPosts = await countThreadPosts(userCache, gnonative, board.id)
      const startIndex = subtractOrZero(totalPosts, PAGE_SIZE)

      const [postsRes, canCreate] = await Promise.all([
        fetchThreadPosts(userCache, gnonative, board.id, startIndex, totalPosts),
        checkThreadCreatePermission(gnonative, board.id, address)
      ])

      return {
        board,
        totalPosts,
        feed: postsRes.data,
        n_posts: postsRes.n_posts,
        canCreate
      }
    } catch (error) {
      console.error('error in loadFeed thunk:', error)
      throw error
    }
  }
)

async function checkThreadCreatePermission(gnonative: GnoNativeApi, boardId: number, address: string): Promise<boolean> {
  const res = await gnonative.qEval('gno.land/r/gnoland/boards2/v1', `IsMember(${boardId},"${address}")`)
  return res === '(true bool)'
}
