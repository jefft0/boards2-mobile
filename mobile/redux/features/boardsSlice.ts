import { createAppAsyncThunk } from '../utils/async-thunk'
import { UserCacheApi } from '@gno/hooks/use-user-cache'
import { User } from '@gno/types'
import { GnoNativeApi } from '@gnolang/gnonative'
import { createSlice } from '@reduxjs/toolkit'
import { ThunkExtra, selectAccount, RootState } from '@gno/redux'
import { PACKAGE_PATH } from '@gno/constants/Constants'

export const boardRegex =
  /\(struct{\((\d+) uint64\),\("([^"]+)" string\),\(nil \[\]string\),\((\w+) bool\),\((\d+) int\),\((\d+) int\),\("(\w+)" \.uverse\.address\),\((\d+) int64\),\((\d+) int64\)} gno\.land\/p\/\w+\/boards\/exts\/hub\/v0\.Board\)/

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
    const boardInfo = await gnonative.qEval(PACKAGE_PATH, `GetBoard(${boardId})`)
    const match = boardRegex.exec(boardInfo)
    return match ? match[2] : undefined
  } catch (error) {
    console.log('Error in maybeFetchBoardName:', error)
    return undefined
  }
}

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

  const boardInfos = await gnonative.qEvalJSON(PACKAGE_PATH, `GetBoards(${startIndex},${endIndex - startIndex})`)  
  const boardCount = await gnonative.qEvalJSON(PACKAGE_PATH, `BoardCount()`)
  const total = decodeIntTypedValue(boardCount.results[0])!

  let boards = []
  let index = 0
  for (const boardJSON of boardInfos.results[0].V.Base.List) {
    const board = await decodeAminoJSON(gnonative, boardJSON)
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

export async function decodeAminoJSON(gnonative: GnoNativeApi, aminoObject: any) : Promise<any> {
  // TODO: Maintain a cache of fetched type definitions
  const aminoType = await gnonative.qTypeJSON(aminoObject.T.ID)
  const typeFields = aminoType.type.Base.Fields
  const objectFields = aminoObject.V.Fields

  const result: Record<string, any> = {}
  for (const [i, obj] of objectFields.entries()) {
    const fieldName = typeFields[i].Name
    let value: any = null

    if (obj.T['@type'] == '/gno.PrimitiveType') {
      const n = decodeIntTypedValue(obj)
      if (n !== undefined)
        value = n
      else if (obj.T.value == '4')
        value = ('N' in obj)
      else if (obj.T.value == '16')
        value = obj.V.value
    }
    else if ('V' in obj && obj.V['@type'] == '/gno.StringValue')
      value = obj.V.value

    console.log("**************", fieldName, value)
    result[fieldName] = value
  }
  return result
}

// The gno PrimitiveType bit flags (gnovm/pkg/gnolang/types.go) of the integer
// types that occupy all 8 bytes of `N`, mapped to whether they are signed.
// Narrower types (int8, int32, uint32, ...) are deliberately absent: they store
// only their low bytes, so reading the full 8 would misread a negative int32 as
// a large positive number.
const eightByteIntTypes: Record<string, boolean> = {
  '32': true, // IntType
  '1024': true, // Int64Type
  '2048': false, // UintType
  '65536': false // Uint64Type
}

// decodeIntTypedValue reads an integer out of an Amino JSON gno.TypedValue, or
// returns undefined if it does not hold a gno `int`, `int64`, `uint` or `uint64`.
// Scalars live in the 8-byte `N` field, not `V`, and amino's `json:",omitempty"`
// drops `N` entirely when every byte is zero — so a missing `N` means zero.
// Values beyond Number.MAX_SAFE_INTEGER lose precision in the Number() cast.
function decodeIntTypedValue(typedValue: any): number | undefined {
  // Guard on the type so a value that is not one of these (where `N` is absent
  // for a different reason) doesn't read as zero.
  const signed = eightByteIntTypes[typedValue?.T?.value]
  if (signed === undefined) {
    return undefined
  }
  if (!typedValue.N) {
    return 0
  }
  const bytes = Uint8Array.from(atob(typedValue.N), (c) => c.charCodeAt(0))
  const view = new DataView(bytes.buffer)
  return Number(signed ? view.getBigInt64(0, true) : view.getBigUint64(0, true))
}
