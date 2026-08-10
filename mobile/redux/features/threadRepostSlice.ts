import { createAppAsyncThunk } from '../utils/async-thunk'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { makeCallTx } from './linkingSlice'
import { Post } from '@gno/types'
import { ThunkExtra, RootState, selectThreadBoard, selectAccount } from '@gno/redux'

// Not exported, unlike threadReplySlice's: the barrel in features/index.ts
// re-exports both slices, and two `State` names there collide.
interface State {
  threadToRepost: Post | undefined
}

const initialState: State = {
  threadToRepost: undefined
}

export const threadRepostSlice = createSlice({
  name: 'repost',
  initialState,
  reducers: {
    setThreadToRepost: (state, action: PayloadAction<Post>) => {
      state.threadToRepost = action.payload
    }
  },
  selectors: {
    selectThreadToRepost: (state) => state.threadToRepost
  }
})

export const { setThreadToRepost } = threadRepostSlice.actions
export const { selectThreadToRepost } = threadRepostSlice.selectors

interface CreateRepostRequestParams {
  repostTitle: string
  repostBody: string
  callbackPath: string
}

export const threadRepostAndRedirectToSign = createAppAsyncThunk<void, CreateRepostRequestParams, ThunkExtra>(
  'threadRepost/CreateRepost',
  async (props, thunkAPI) => {
    try {
      const board = selectThreadBoard(thunkAPI.getState() as RootState)
      const thread = selectThreadToRepost(thunkAPI.getState() as RootState)
      const callerAddressBech32 = selectAccount(thunkAPI.getState() as RootState)?.bech32 as string

      if (!board || !thread) throw new Error('No active board or thread')

      const { repostTitle, repostBody, callbackPath } = props

      // Matches the realm signature:
      //   CreateRepost(cur realm, boardID, threadID, destinationBoardID boards.ID, title, body string)
      // The realm reposts *into* destinationBoardID and checks the caller's
      // PermissionThreadRepost there. The form has no board picker yet, so the
      // destination is hardwired to board 1 for now.
      const fnc = 'CreateRepost'
      const gasFee = '1000000ugnot'
      const gasWanted = BigInt(50000000)
      // TODO: The caller should let the user select the destination board.
      const destinationBoardID = '1'
      const args: string[] = [String(board.id), String(thread.id), destinationBoardID, repostTitle, repostBody]
      const reason = 'Repost a message'

      await makeCallTx({ fnc, args, gasFee, gasWanted, callerAddressBech32, reason, callbackPath }, thunkAPI.extra.gnonative)
    } catch (error) {
      console.error('Error in threadRepostAndRedirectToSign thunk:', error)
    }
  }
)
