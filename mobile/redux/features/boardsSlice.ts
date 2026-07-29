import { createAppAsyncThunk } from '../utils/async-thunk'
import { UserCacheApi } from '@gno/hooks/use-user-cache'
import { User } from '@gno/types'
import { GnoNativeApi } from '@gnolang/gnonative'
import { createSlice } from '@reduxjs/toolkit'
import { ThunkExtra, selectAccount, RootState } from '@gno/redux'
import { PACKAGE_PATH } from '@gno/constants/Constants'

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
  readOnly: boolean
  n_threads: number
  n_members: number
  creator: string
  creatorName?: User
  createdAt: string
  updatedAt: string
}

type BoardsRequest = {
  startIndex: number
  endIndex: number
}

export const getListedBoards = createAppAsyncThunk<BoardsResult | undefined, BoardsRequest, ThunkExtra>(
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
    const res = await gnonative.qEval(PACKAGE_PATH, `IsMember(0,"${address}")`)
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

  const boardInfos = await gnonative.qEval(PACKAGE_PATH, `GetBoards(${startIndex},${endIndex - startIndex})`)
  const boardCount = await gnonative.qEval(PACKAGE_PATH, `BoardCount()`)
  const totalRegex = /^\((\d+) int\)/g
  const totalMatch = totalRegex.exec(boardCount)
  if (!totalMatch) throw new Error("Can't find total in BoardCount response")
  const total = Number(totalMatch![1])

  const boardRegex =
    /\(struct{\((\d+) uint64\),\("([^"]+)" string\),\(nil \[\]string\),\((\w+) bool\),\((\d+) int\),\((\d+) int\),\("(\w+)" \.uverse\.address\),\((\d+) int64\),\((\d+) int64\)} gno\.land\/p\/\w+\/boards\/exts\/hub\.Board\)/g
  let boards = []
  let index = 0
  let match
  while ((match = boardRegex.exec(boardInfos)) !== null) {
    const boardId = Number(match[1])
    const name = match[2]
    // TODO: aliases
    const readOnly = match[3] === 'true'
    const n_threads = Number(match[4])
    const n_members = Number(match[5])
    const creator = match[6]
    const creatorName = await userCache.getUser(creator)
    const createdAtUnix = Number(match[7])
    const createdAt = new Date(createdAtUnix * 1000).toISOString()
    const updatedAtUnix = Number(match[8])
    const updatedAt = new Date(updatedAtUnix * 1000).toISOString()
    boards.push({
      index,
      board: { id: boardId, name, readOnly, n_threads, n_members, creator, creatorName, createdAt, updatedAt }
    })
    ++index
  }

  return { n_boards: total, boards }
}
