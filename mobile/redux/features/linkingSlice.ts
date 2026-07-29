import { createAppAsyncThunk } from '../utils/async-thunk'
import { PACKAGE_PATH } from '@gno/constants/Constants'
import { Post } from '@gno/types'
import { GnoNativeApi } from '@gnolang/gnonative'
import { createSlice } from '@reduxjs/toolkit'
import { Buffer } from 'buffer'
import * as Linking from 'expo-linking'
import { ThunkExtra } from '@gno/redux'
import { issueState } from '@gno/utils/callback-state'

// GnoConnect launch-link / callback conventions.
const GNOKEY_SCHEME = 'land.gno.gnokey'
const BOARDS2_CALLBACK = 'land.gno.boards2:/'

interface State {
  /** Last non-success callback, so a screen can stop waiting and say why.
   *  `code` is the wallet's enumerated reason (`no_signer`, `tx_failed`, …),
   *  never prose — branch on it, don't display it raw. */
  failure: { status: string; code?: string } | undefined
  txJsonSigned: string | undefined
  bech32AddressSelected: string | undefined
  chainId: string | undefined
  remoteURL: string | undefined
}

const initialState: State = {
  failure: undefined,
  txJsonSigned: undefined,
  bech32AddressSelected: undefined,
  chainId: undefined,
  remoteURL: undefined
}

export const requestLoginForGnokeyMobile = createAppAsyncThunk<boolean, void, ThunkExtra>(
  'tx/requestLoginForGnokeyMobile',
  async (_, thunkAPI) => {
    // GnoConnect `connect`: display-level sign-in, no challenge or signature.
    // The wallet returns the address; `state` correlates the response.
    const gnonative = thunkAPI.extra.gnonative
    const state = issueState()
    const url = new URL(`${GNOKEY_SCHEME}://connect`)
    url.searchParams.append('callback', `${BOARDS2_CALLBACK}/signin-callback`)
    url.searchParams.append('state', state)

    // Name the network we expect: `connect` takes rpc/chainid so the wallet can
    // offer to switch *before* answering. Omitted, it answers from whatever
    // network it is on and the mismatch surfaces later as a refusal in
    // `loggedIn` the user cannot act on from here.
    url.searchParams.append('rpc', await gnonative.getRemote())
    url.searchParams.append('chainid', await gnonative.getChainID())

    console.log('redirecting to: ', url.toString())
    return await Linking.openURL(url.toString())
  }
)

/**
 * Parameter names, in declaration order, taken from the realm sources rather
 * than guessed: a wrong name binds as an unknown argument while the real
 * parameter goes out empty.
 *
 * `AddReaction` and `RepostThread` are absent because neither is an exported
 * function of the realm — only a `renderRepostThread` render route — so they
 * fall back to positional `args=`.
 */
const ARG_NAMES: Record<string, string[]> = {
  CreateBoard: ['name', 'listed', 'open'],
  CreateThread: ['boardID', 'title', 'body'],
  CreateReply: ['boardID', 'threadID', 'replyID', 'body'],
  SetStringField: ['field', 'value']
}

type MakeCallTxParams = {
  packagePath?: string
  fnc: string
  args: string[]
  gasFee: string
  gasWanted: bigint
  send?: string
  memo?: string
  callerAddressBech32: string
  reason: string
  callbackPath: string
}

export const makeCallTx = async (props: MakeCallTxParams, gnonative: GnoNativeApi): Promise<void> => {
  const { fnc, callerAddressBech32, args, packagePath = PACKAGE_PATH, callbackPath, send } = props

  // GnoConnect `signtx`, the sign-only host: gnokey builds the MsgCall, the user
  // signs, and the tx comes back on `signedtx` for us to broadcast. Sign-only is
  // its own host rather than a `broadcast=false` flag, so a wallet without it
  // declines (`unsupported_host`) instead of broadcasting what we asked it only
  // to sign. `signer` pins the account; `state` rejects forged callbacks.
  const state = issueState()

  const url = new URL(`${GNOKEY_SCHEME}://signtx`)
  url.searchParams.append('path', packagePath)
  url.searchParams.append('func', fnc)

  // Named `arg.<name>` params are what the standard asks producers to emit.
  // Positional `args=` is a back-compat alias that binds by position, so any
  // divergence from the realm's declaration order lands values in the wrong
  // parameters silently — use it only where we lack the signature.
  const names = ARG_NAMES[fnc]
  if (names && names.length === args.length) {
    args.forEach((value, i) => url.searchParams.append(`arg.${names[i]}`, value))
  } else {
    for (const arg of args) url.searchParams.append('args', arg)
  }
  if (send) url.searchParams.append('send', send)
  url.searchParams.append('rpc', await gnonative.getRemote())
  url.searchParams.append('chainid', await gnonative.getChainID())
  url.searchParams.append('signer', callerAddressBech32)
  url.searchParams.append('callback', BOARDS2_CALLBACK + callbackPath)
  url.searchParams.append('state', state)

  console.log('redirecting to: ', url.toString())
  Linking.openURL(url.toString())
}

export const broadcastTxCommit = createAppAsyncThunk<void, string, ThunkExtra>(
  'tx/broadcastTxCommit',
  async (signedTx, thunkAPI) => {
    console.log('broadcasting tx: ', signedTx)
    const gnonative = thunkAPI.extra.gnonative

    // `broadcastTxCommit` returns a stream, so awaiting it only hands back the
    // iterator: unless it is driven, the transaction never leaves the device and
    // the empty result looks like success. Iterate it.
    const stream = await gnonative.broadcastTxCommit(signedTx)
    let delivered = false
    for await (const res of stream) {
      delivered = true
      console.log('broadcast result: height=%s hash=%s', String(res.height), Buffer.from(res.hash).toString('base64'))
    }
    if (!delivered) {
      throw new Error('Broadcast produced no response; the transaction was not sent.')
    }
  }
)

interface GnodCallTxParams {
  post: Post
  callerAddressBech32: string
  callbackPath: string
}

export const gnodTxAndRedirectToSign = createAppAsyncThunk<void, GnodCallTxParams, ThunkExtra>(
  'tx/gnodTxAndRedirectToSign',
  async (props, thunkAPI) => {
    console.log('gnodding post: ', props.post)
    const { post, callerAddressBech32, callbackPath } = props

    const fnc = 'AddReaction'
    const gasFee = '1000000ugnot'
    const gasWanted = BigInt(10000000)
    // post.user.address is in fact a bech32 address
    const args: string[] = [String(post.user.address), String(post.id), String(post.id), String('0')]
    const reason = 'Gnoding a message'

    await makeCallTx({ fnc, args, gasFee, gasWanted, callerAddressBech32, reason, callbackPath }, thunkAPI.extra.gnonative)
  }
)

/**
 * Slice to handle linking between the app and the GnokeyMobile app
 */
export const linkingSlice = createSlice({
  name: 'linking',
  initialState,
  extraReducers: (builder) => {
    builder.addCase(broadcastTxCommit.fulfilled, (state) => {
      state.failure = undefined
      state.txJsonSigned = undefined
      state.bech32AddressSelected = undefined
      state.chainId = undefined
      state.remoteURL = undefined
    })
  },
  reducers: {
    setLinkingData: (state, action) => {
      const q = action.payload.queryParams ?? {}

      // A cancelled or failed request: record it so the screen that opened the
      // wallet can stop waiting and explain, and leave the rest untouched so no
      // stale address or tx is picked up.
      if (q.status && q.status !== 'success') {
        state.failure = { status: q.status as string, code: q.code as string | undefined }
        return
      }
      state.failure = undefined

      // connect: display-level identity only — the address is untrusted,
      // authority comes from the on-chain tx gnokey signs.
      if (q.address) state.bech32AddressSelected = q.address as string

      // sign-only returns the tx base64-encoded (amino-JSON); `tx` stays
      // supported for the legacy tosign flow.
      if (q.signedtx) {
        state.txJsonSigned = Buffer.from(q.signedtx as string, 'base64').toString('utf-8')
      } else if (q.tx) {
        state.txJsonSigned = q.tx as string
      }

      if (q.chainid || q.chain_id) state.chainId = (q.chainid ?? q.chain_id) as string
      if (q.remote) state.remoteURL = q.remote as string
    },
    clearLinking: (state) => {
      console.log('clearing linking data')
      state.failure = undefined
      state.txJsonSigned = undefined
      state.bech32AddressSelected = undefined
      state.chainId = undefined
      state.remoteURL = undefined
    }
  },
  selectors: {
    selectLinkingFailure: (state: State) => state.failure,
    selectQueryParamsTxJsonSigned: (state: State) => state.txJsonSigned as string | undefined,
    selectBech32AddressSelected: (state: State) => state.bech32AddressSelected as string | undefined,
    selectChainId: (state: State) => state.chainId as string | undefined,
    selectRemoteURL: (state: State) => state.remoteURL as string | undefined
  }
})

export const { clearLinking, setLinkingData } = linkingSlice.actions

export const {
  selectLinkingFailure,
  selectQueryParamsTxJsonSigned,
  selectBech32AddressSelected,
  selectChainId,
  selectRemoteURL
} = linkingSlice.selectors
