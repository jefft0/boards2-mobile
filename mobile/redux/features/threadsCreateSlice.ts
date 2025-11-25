import { Post } from '@gno/types'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ThunkExtra, Board, makeCallTx, selectAccount, RootState } from '@gno/redux'

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

export const threadsCreateSlice = createSlice({
  name: 'threadsCreate',
  initialState,
  reducers: {},
  extraReducers() {},
  selectors: {}
})

// export const {} = threadsCreateSlice.actions

// export const {} = threadsCreateSlice.selectors

export type ThreadCreateParams = {
  boardId: string
  threadName: string
  threadBody: string
}

export const threadCreate = createAsyncThunk<void, ThreadCreateParams, ThunkExtra>(
  'threadsCreate/threadCreate',
  async (props, thunkAPI) => {
    const { boardId, threadName, threadBody } = props
    const callerAddressBech32 = selectAccount(thunkAPI.getState() as RootState)?.bech32 as string

    const fnc = 'CreateThread'
    const args: string[] = [boardId, threadName, threadBody]
    const gasFee = '1000000ugnot'
    const gasWanted = BigInt(50000000)
    const reason = 'Post a message'
    const callbackPath = `/boards/${boardId}/new-thread`

    await makeCallTx({ fnc, args, gasFee, gasWanted, callerAddressBech32, reason, callbackPath }, thunkAPI.extra.gnonative)
  }
)
