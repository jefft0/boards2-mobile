import { createAsyncThunk, createSlice, RootState } from '@reduxjs/toolkit'
import { ThunkExtra, Board, makeCallTx } from '@gno/redux'

export interface BoardsCreateState {
  boards: Board[]
  loading: boolean
  error?: string
  totalPosts?: number
  startIndex?: number
  endIndex?: number
}

const initialState = {
  boards: [] as Board[],
  loading: false,
  error: undefined,
  count: undefined,
  startIndex: undefined,
  endIndex: undefined
} as BoardsCreateState

export const boardsCreateSlice = createSlice({
  name: 'boardsCreate',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(createBoard.fulfilled, (state, action) => {
      state.loading = false
      console.log('createBoard.fulfilled', action.payload)
    })
    builder.addCase(createBoard.pending, (state) => {
      state.loading = true
      state.error = undefined
    })
    builder.addCase(createBoard.rejected, (state, action) => {
      state.loading = false
      state.error = action.error.message
      console.error('createBoard.rejected', action.error)
    })
  },
  selectors: {
    selectBoards: (state: BoardsCreateState) => state.boards,
    selectBoardsLoading: (state: BoardsCreateState) => state.loading
  }
})

// export const {} = boardsCreateSlice.actions

// export const {} = boardsCreateSlice.selectors

type BoardsResult = {
  n_boards: number
  boards: {
    index: number
    board: Board
  }[]
}

export interface BoardCreationData {
  boardName: string
  isPublic: boolean
}

export const createBoard = createAsyncThunk<BoardsResult | undefined, BoardCreationData, ThunkExtra>(
  'boardsCreate/create',
  async (param, thunkAPI) => {
    const { boardName, isPublic } = param

    const callerAddressBech32 = (thunkAPI.getState() as RootState).account.account?.bech32

    const fnc = 'CreateBoard'
    const args: string[] = [boardName, isPublic.toString()]
    const gasFee = '100000ugnot'
    const gasWanted = BigInt(50000000)
    const reason = 'Creating a new board'
    const callbackPath = '/boards/new'

    await makeCallTx({ fnc, args, gasFee, gasWanted, callerAddressBech32, reason, callbackPath }, thunkAPI.extra.gnonative)

    return { n_boards: 1, boards: [] }
  }
)
