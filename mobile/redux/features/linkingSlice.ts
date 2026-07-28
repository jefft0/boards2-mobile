import { PACKAGE_PATH } from '@gno/constants/Constants'
import { Post } from '@gno/types'
import { GnoNativeApi } from '@gnolang/gnonative'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { Buffer } from 'buffer'
import * as Linking from 'expo-linking'
import { ThunkExtra } from '@gno/redux'
import { issueState } from '@gno/utils/callback-state'

// GnoConnect launch-link / callback conventions.
const GNOKEY_SCHEME = 'land.gno.gnokey'
const BOARDS2_CALLBACK = 'land.gno.boards2:/'

interface State {
  /** Last non-success callback, so a screen can stop waiting and say why.
   *  `code` is the wallet's enumerated, machine-readable reason (e.g.
   *  `no_signer`, `signer_unavailable`, `tx_failed`, `network_declined`), never
   *  human prose — branch on it, don't display it raw. */
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

export const requestLoginForGnokeyMobile = createAsyncThunk<boolean>('tx/requestLoginForGnokeyMobile', async () => {
  // GnoConnect `connect`: display-level sign-in (no challenge/signature). The
  // wallet returns the address to our callback; `state` correlates the response.
  const state = issueState()
  const url = new URL(`${GNOKEY_SCHEME}://connect`)
  url.searchParams.append('callback', `${BOARDS2_CALLBACK}/signin-callback`)
  url.searchParams.append('state', state)
  console.log('redirecting to: ', url)
  return await Linking.openURL(url.toString())
})

/**
 * Parameter names, in declaration order, for the realm functions we call —
 * taken from the realm sources, not guessed: a wrong name would be bound as an
 * unknown argument while the real parameter went out empty.
 *
 * `AddReaction` and `RepostThread` are deliberately absent: neither is an
 * exported function of `gno.land/r/gnoland/boards2/v1` (the realm only has a
 * `renderRepostThread` *render* route), so there is no signature to name them
 * from. Those calls fall back to positional `args=`.
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

  // GnoConnect `signtx` launch link (the sign-only host): gnokey builds the
  // MsgCall from these params, the user reviews and signs, and returns the signed
  // tx to our callback (`signedtx`) for us to broadcast. Sign-only is its own
  // host, not a `broadcast=false` flag, so a wallet that doesn't support it
  // declines (`unsupported_host`) instead of broadcasting a tx we asked it only
  // to sign. `signer` pins the account (from `connect`); `state` correlates the
  // response and rejects forged callbacks.
  const state = issueState()

  const url = new URL(`${GNOKEY_SCHEME}://signtx`)
  url.searchParams.append('path', packagePath)
  url.searchParams.append('func', fnc)

  // Prefer named `arg.<name>` params (the encoding the standard asks producers
  // to emit). Positional `args=` is only a back-compat alias, and it binds by
  // position: if our order ever diverges from the realm's declaration order the
  // values land in the wrong parameters silently. Fall back to it only for
  // functions whose signature we don't have.
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

  console.log('redirecting to: ', url)
  Linking.openURL(url.toString())
}

export const broadcastTxCommit = createAsyncThunk<void, string, ThunkExtra>(
  'tx/broadcastTxCommit',
  async (signedTx, thunkAPI) => {
    console.log('broadcasting tx: ', signedTx)
    const gnonative = thunkAPI.extra.gnonative

    // `broadcastTxCommit` returns a *stream* (Promise<AsyncIterable<…>>), so
    // awaiting it only hands back the iterator — the call is never driven and
    // the transaction never leaves the device. It logged an empty object and
    // looked like a success while nothing reached the chain. Iterate it.
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

export const gnodTxAndRedirectToSign = createAsyncThunk<void, GnodCallTxParams, ThunkExtra>(
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

      // A failed sign-in / signing (user cancelled or wallet error): record it
      // so the screen that opened the wallet can stop waiting and explain, and
      // leave the rest untouched so no stale address/tx is picked up. Silently
      // swallowing this leaves the UI spinning on a request the user declined.
      if (q.status && q.status !== 'success') {
        state.failure = { status: q.status as string, code: q.code as string | undefined }
        return
      }
      state.failure = undefined

      // connect: the user's address (display-level identity; the address is
      // untrusted — authority comes from the on-chain tx gnokey signs).
      if (q.address) state.bech32AddressSelected = q.address as string

      // tx sign-only: the signed tx is returned base64-encoded (amino-JSON);
      // decode it for broadcastTxCommit. `tx` stays supported for the legacy
      // tosign flow.
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
