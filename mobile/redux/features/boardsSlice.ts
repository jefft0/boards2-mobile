import { UserCacheApi } from '@gno/hooks/use-user-cache'
import { User } from '@gno/types'
import { GnoNativeApi } from '@gnolang/gnonative'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ThunkExtra } from '@gno/redux'

export interface BoardsState {
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
} as BoardsState

export const boardsSlice = createSlice({
  name: 'boards',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(getListedBoards.fulfilled, (state, action) => {
      state.loading = false
      console.log('xxxx4', action.payload)
      state.boards = action.payload?.boards.map((b) => b.board) || []
    })
    builder.addCase(getListedBoards.pending, (state) => {
      state.loading = true
      state.error = undefined
    })
    builder.addCase(getListedBoards.rejected, (state, action) => {
      state.loading = false
      console.log('xxxx5', action.error)
      state.error = action.error.message
    })
  },
  selectors: {
    selectBoards: (state: BoardsState) => state.boards,
    selectBoardsLoading: (state: BoardsState) => state.loading
  }
})

export const {} = boardsSlice.actions

export const { selectBoards, selectBoardsLoading } = boardsSlice.selectors

type BoardsResult = {
  n_boards: number
  boards: {
    index: number
    board: Board
  }[]
}

export type Board = {
  id: number
  name: string
  creator: string
  creatorName?: User
  hidden: boolean
  n_threads: number
  createdAt: string
}

type BoardsRequest = {
  startIndex: number
  endIndex: number
}

export const getListedBoards = createAsyncThunk<BoardsResult | undefined, BoardsRequest, ThunkExtra>(
  'boards/getListedBoards',
  async (param, thunkAPI) => {
    console.log('Loading Boards', param)
    const { startIndex, endIndex } = param
    const gnonative = thunkAPI.extra.gnonative as GnoNativeApi
    const userCache = thunkAPI.extra.userCache as UserCacheApi

    const boardInfos = await gnonative.qEval('gno.land/r/gnoland/boards2/v1', `GetListedBoards(${startIndex},${endIndex})`)
    const totalRegex = /^\((\d+) int\)/g
    const totalMatch = totalRegex.exec(boardInfos)
    if (!totalMatch) throw new Error("Can't find total in GetListedBoards response")
    const total = Number(totalMatch![1])

    const boardRegex =
      /\(struct{\((\d+) gno.land\/r\/gnoland\/boards2\/v1.BoardID\),\("([^"]+)" string\),\([^ ]+ \[\]string\),\("(\w+)" .uverse.address\),\((\w+) bool\),\((\d+) int\),\("([^"]+)" string\)} gno.land\/r\/gnoland\/boards2\/v1.BoardInfo\)/g
    let boards = []
    let index = 0
    let match
    while ((match = boardRegex.exec(boardInfos)) !== null) {
      const boardId = Number(match[1])
      const name = match[2]
      const creator = match[3]
      const creatorName = await userCache.getUser(creator)
      const hidden = match[4] === 'true'
      const n_threads = Number(match[5])
      const createdAt = match[6]
      boards.push({
        index,
        board: { id: boardId, name, creator, hidden, n_threads, createdAt, creatorName }
      })
      ++index
    }

    return { n_boards: total, boards }
  }
)
