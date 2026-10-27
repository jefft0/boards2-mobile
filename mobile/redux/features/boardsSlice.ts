import { createAppAsyncThunk } from '../utils/async-thunk'
import { UserCacheApi } from '@gno/hooks/use-user-cache'
import { User } from '@gno/types'
import { GnoValue, GnoNativeApi } from '@gnolang/gnonative'
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

// Look up a board's name with GetBoard. Returns undefined when the ID matches no
// board, so callers can fall back to a placeholder.
export async function maybeFetchBoardName(gnonative: GnoNativeApi, boardId: number): Promise<string | undefined> {
  try {
    const boardInfo = await gnonative.qEvalJSONValues(PACKAGE_PATH, `GetBoard(${boardId})`)
    const board = gnoValuesToObject(boardInfo.results[0].fields)
    return board.name
  } catch (error) {
    console.log('Error in maybeFetchBoardName:', error)
    return undefined
  }
}

async function checkBoardCreatePermission(gnonative: GnoNativeApi, address: string): Promise<boolean> {
  try {
    const res = await gnonative.qEvalJSONValues(PACKAGE_PATH, `IsMember(0,"${address}")`)
    return res.results[0].scalar === 'true'
  } catch (error) {
    console.error('error in checkBoardCreatePermission:', error)
    return false
  }
}

async function listBoards(thunkAPI: ThunkExtra, startIndex: number, endIndex: number) {
  console.log('Loading Boards', { startIndex, endIndex })
  const gnonative = thunkAPI.extra.gnonative as GnoNativeApi
  const userCache = thunkAPI.extra.userCache as UserCacheApi

  const boardInfos = await gnonative.qEvalJSONValues(PACKAGE_PATH, `GetBoards(${startIndex},${endIndex - startIndex})`)
  const boardCount = await gnonative.qEvalJSONValues(PACKAGE_PATH, `BoardCount()`)
  const total = Number(boardCount.results[0].scalar)

  let boards = []
  let index = 0
  for (const boardValue of boardInfos.results[0].elems) {
    const board = gnoValuesToObject(boardValue.fields)
    const id = board.id
    const name = board.name
    // TODO: aliases
    const readOnly = board.readonly
    const n_threads = board.threadCount
    const n_members = board.memberCount
    const creator = board.creator
    const creatorName = await userCache.getUser(creator)
    const createdAtUnix = board.createdAt
    const createdAt = new Date(createdAtUnix * 1000).toISOString()
    const updatedAtUnix = board.updatedAt
    const updatedAt = new Date(updatedAtUnix * 1000).toISOString()
    boards.push({
      index,
      board: { id, name, readOnly, n_threads, n_members, creator, creatorName, createdAt, updatedAt }
    })
    ++index
  }

  return { n_boards: total, boards }
}

// The fields of a GnoValue of a struct is an array of GnoValue, where
// each has the field name and value. gnoValuesToObject constructs
// a TypeScript object using the field name and converting the "scalar"
// string into a native TypeScript value. If the kind is not recognized, value is null.
export function gnoValuesToObject(values: GnoValue[]): any {
  const result: Record<string, any> = {}

  for (const value of values) {
    let v: any = null
    if (value.kind === 'string') v = value.scalar
    else if (value.kind === 'number') v = Number(value.scalar)
    else if (value.kind === 'bool') v = value.scalar === 'true'

    result[value.name] = v
  }

  return result
}
