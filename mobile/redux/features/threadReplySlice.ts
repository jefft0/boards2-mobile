import { createAppAsyncThunk } from '../utils/async-thunk'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { makeCallTx } from './linkingSlice'
import { PostBase } from '@gno/types'
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
  // The reply which the edit screen is editing travels through the store rather
  // than through the route, which a long body would not survive.
  replyToEdit: PostBase | undefined
}

const initialState: State = {
  replyTarget: undefined,
  replyToEdit: undefined
}

export const threadReplySlice = createSlice({
  name: 'reply',
  initialState,
  reducers: {
    setReplyTarget: (state, action: PayloadAction<ReplyTarget>) => {
      state.replyTarget = action.payload
    },
    setReplyToEdit: (state, action: PayloadAction<PostBase>) => {
      state.replyToEdit = action.payload
    }
  },
  selectors: {
    selectReplyTarget: (state) => state.replyTarget,
    selectReplyToEdit: (state) => state.replyToEdit
  }
})

export const { setReplyTarget, setReplyToEdit } = threadReplySlice.actions
export const { selectReplyTarget, selectReplyToEdit } = threadReplySlice.selectors

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

interface DeleteReplyRequestParams {
  boardId: number
  threadId: number
  // The comment or (nested) reply to delete.
  replyId: number
  callbackPath: string
}

export const deleteReplyAndRedirectToSign = createAppAsyncThunk<void, DeleteReplyRequestParams, ThunkExtra>(
  'threadReply/DeleteReply',
  async (props, thunkAPI) => {
    try {
      const callerAddressBech32 = selectAccount(thunkAPI.getState() as RootState)?.bech32 as string

      const { boardId, threadId, replyId, callbackPath } = props

      // If a reply that has sub-replies, it replaces the body with a notice rather than
      // removing it, so the post can survive the call and come back changed.
      const fnc = 'DeleteReply'
      const gasFee = '1000000ugnot'
      const gasWanted = BigInt(50000000)
      const args: string[] = [String(boardId), String(threadId), String(replyId)]
      const reason = 'Delete a message'

      await makeCallTx({ fnc, args, gasFee, gasWanted, callerAddressBech32, reason, callbackPath }, thunkAPI.extra.gnonative)
    } catch (error) {
      console.error('Error in deleteReplyAndRedirectToSign thunk:', error)
    }
  }
)

interface EditReplyRequestParams {
  boardId: number
  threadId: number
  // The comment or (nested) reply to edit.
  replyId: number
  replyBody: string
  callbackPath: string
}

export const editReplyAndRedirectToSign = createAppAsyncThunk<void, EditReplyRequestParams, ThunkExtra>(
  'threadReply/EditReply',
  async (props, thunkAPI) => {
    try {
      const callerAddressBech32 = selectAccount(thunkAPI.getState() as RootState)?.bech32 as string

      const { boardId, threadId, replyId, replyBody, callbackPath } = props

      const fnc = 'EditReply'
      const gasFee = '1000000ugnot'
      const gasWanted = BigInt(50000000)
      const args: string[] = [String(boardId), String(threadId), String(replyId), replyBody]
      const reason = 'Edit a message'

      await makeCallTx({ fnc, args, gasFee, gasWanted, callerAddressBech32, reason, callbackPath }, thunkAPI.extra.gnonative)
    } catch (error) {
      console.error('Error in editReplyAndRedirectToSign thunk:', error)
    }
  }
)
