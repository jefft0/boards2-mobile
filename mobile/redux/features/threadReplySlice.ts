import { createAppAsyncThunk } from '../utils/async-thunk'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { makeCallTx } from './linkingSlice'
import { ThunkExtra, RootState, selectAccount } from '@gno/redux'

// What a new reply answers. The realm's CreateReply takes a zero replyId to
// reply to the thread itself, or the ID of the comment or reply being answered.
export interface ReplyTarget {
  boardId: number
  threadId: number
  replyId: number
}

export interface State {
  replyTarget: ReplyTarget | undefined
}

const initialState: State = {
  replyTarget: undefined
}

export const threadReplySlice = createSlice({
  name: 'reply',
  initialState,
  reducers: {
    setReplyTarget: (state, action: PayloadAction<ReplyTarget>) => {
      state.replyTarget = action.payload
    }
  },
  selectors: {
    selectReplyTarget: (state) => state.replyTarget
  }
})

export const { setReplyTarget } = threadReplySlice.actions
export const { selectReplyTarget } = threadReplySlice.selectors

interface CreateReplyRequestParams {
  replyBody: string
  callbackPath: string
}

export const threadReplyAndRedirectToSign = createAppAsyncThunk<void, CreateReplyRequestParams, ThunkExtra>(
  'threadReply/CreateReply',
  async (props, thunkAPI) => {
    try {
      const target = selectReplyTarget(thunkAPI.getState() as RootState)
      const callerAddressBech32 = selectAccount(thunkAPI.getState() as RootState)?.bech32 as string

      if (!target) throw new Error('No reply target')

      const { replyBody, callbackPath } = props

      const fnc = 'CreateReply'
      const gasFee = '1000000ugnot'
      const gasWanted = BigInt(50000000)
      const args: string[] = [String(target.boardId), String(target.threadId), String(target.replyId), replyBody]
      const reason = 'Reply a message'

      await makeCallTx({ fnc, args, gasFee, gasWanted, callerAddressBech32, reason, callbackPath }, thunkAPI.extra.gnonative)
    } catch (error) {
      console.error('Error in threadReplyAndRedirectToSign thunk:', error)
    }
  }
)
