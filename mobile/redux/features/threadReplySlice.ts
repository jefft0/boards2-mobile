import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { makeCallTx } from './linkingSlice'
import { Post } from '@gno/types'
import { ThunkExtra, RootState, selectThreadBoard, selectAccount } from '@gno/redux'

export interface State {
  threadToReply: Post | undefined
}

const initialState: State = {
  threadToReply: undefined
}

export const threadReplySlice = createSlice({
  name: 'reply',
  initialState,
  reducers: {
    setThreadToReply: (state, action: PayloadAction<Post>) => {
      state.threadToReply = action.payload
    }
  },
  selectors: {
    selectThreadToReply: (state) => state.threadToReply
  }
})

export const { setThreadToReply } = threadReplySlice.actions
export const { selectThreadToReply } = threadReplySlice.selectors

interface RepostTxAndRedirectParams {
  post: Post
  replyContent: string
  callerAddressBech32: string
}

export const repostTxAndRedirectToSign = createAsyncThunk<void, RepostTxAndRedirectParams, ThunkExtra>(
  'tx/repostTxAndRedirectToSign',
  async (props, thunkAPI) => {
    const { post, replyContent, callerAddressBech32 } = props

    const fnc = 'RepostThread'
    // post.user.address is in fact a bech32 address
    const args: string[] = [String(post.user.address), String(post.id), replyContent]
    const gasFee = '1000000ugnot'
    const gasWanted = BigInt(10000000)
    const reason = 'Repost a message'
    const callbackPath = '/repost'
    // const session = (thunkAPI.getState() as RootState).linking.session;

    // await makeCallTx({ fnc, args, gasFee, gasWanted, callerAddressBech32, reason, callbackPath, session }, thunkAPI.extra.gnonative);
    await makeCallTx({ fnc, args, gasFee, gasWanted, callerAddressBech32, reason, callbackPath }, thunkAPI.extra.gnonative)
  }
)

type ReplytTxAndRedirectParams = {
  post: Post
  replyContent: string
  callerAddressBech32: string
  callbackPath: string
}

interface CreateReplyRequestParams {
  replyBody: string
  callbackPath: string
}

export const threadReplyAndRedirectToSign = createAsyncThunk<void, CreateReplyRequestParams, ThunkExtra>(
  'threadReply/CreateReply',
  async (props, thunkAPI) => {
    const boad = selectThreadBoard(thunkAPI.getState() as RootState)
    const thread = selectThreadToReply(thunkAPI.getState() as RootState)
    const callerAddressBech32 = selectAccount(thunkAPI.getState() as RootState)?.bech32 as string

    if (!boad || !thread) throw new Error('No active board or thread')

    const { replyBody, callbackPath } = props

    const fnc = 'CreateReply'
    const gasFee = '1000000ugnot'
    const gasWanted = BigInt(50000000)
    const args: string[] = [String(boad.id), String(thread.id), '0', replyBody]
    const reason = 'Reply a message'
    // const session = (thunkAPI.getState() as RootState).linking.session;

    // await makeCallTx({ fnc, args, gasFee, gasWanted, callerAddressBech32, reason, callbackPath, session }, thunkAPI.extra.gnonative);
    await makeCallTx({ fnc, args, gasFee, gasWanted, callerAddressBech32, reason, callbackPath }, thunkAPI.extra.gnonative)
  }
)
