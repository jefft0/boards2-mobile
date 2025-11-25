import { UserCacheApi } from '@gno/hooks/use-user-cache'
import { User } from '@gno/types'
import { GnoNativeApi } from '@gnolang/gnonative'
import { createAsyncThunk, createSlice, selectCanCreateThread } from '@reduxjs/toolkit'
import { ThunkExtra, selectAccount, RootState } from '@gno/redux'

export interface BoardsState {
  boards: Board[]
  loading: boolean
  error?: string
  totalPosts?: number
  startIndex?: number
  endIndex?: number
  canCreate: boolean
}

const initialState = {
  boards: [] as Board[],
  loading: false,
  error: undefined,
  count: undefined,
  startIndex: undefined,
  endIndex: undefined,
  canCreate: false
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
      state.canCreate = action.payload?.canCreate || false
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
    selectBoardsLoading: (state: BoardsState) => state.loading,
    selectCanCreateBoard: (state: BoardsState) => state.canCreate
  }
})

export const {} = boardsSlice.actions

export const { selectBoards, selectBoardsLoading, selectCanCreateBoard } = boardsSlice.selectors

type BoardsResult = {
  canCreate: boolean
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
    const address = selectAccount(thunkAPI.getState() as RootState)?.bech32 as string

    const [listResult, canCreate] = await Promise.all([
      listBoards(thunkAPI, param.startIndex, param.endIndex),
      checkBoardCreatePermission(thunkAPI.extra.gnonative as GnoNativeApi, address)
    ])

    return {
      ...listResult,
      canCreate
    }
  }
)

async function checkBoardCreatePermission(gnonative: GnoNativeApi, address: string): Promise<boolean> {
  try {
    const res = await gnonative.qEval('gno.land/r/gnoland/boards2/v1', `IsMember(0,"${address}")`)
    return res === '(true bool)'
  } catch (error) {
    console.error('error in checkBoardCreatePermission:', error)
    return false
  }
}

async function listBoards(thunkAPI: ThunkExtra, startIndex: number, endIndex: number) {
  console.log('Loading Boards', { startIndex, endIndex })
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
