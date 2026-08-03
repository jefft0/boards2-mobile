import { createAppAsyncThunk } from '../utils/async-thunk'
import { PACKAGE_PATH } from '@gno/constants/Constants'
import { Post } from '@gno/types'
import { GnoNativeApi } from '@gnolang/gnonative'
import { createSlice } from '@reduxjs/toolkit'
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
  signedTx: string | undefined
  bech32AddressSelected: string | undefined
  chainId: string | undefined
  remoteURL: string | undefined
}

const initialState: State = {
  failure: undefined,
  signedTx: undefined,
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

  // The standard's two argument forms, and a link uses one or the other —
  // mixing them is `invalid_request`.
  //
  // Named `arg.<name>` says nothing about order, so the wallet resolves it from
  // the realm's signature via `vm/qdoc`; that is the safe default and what we
  // emit whenever we know the parameter names. Positional `args=` asserts the
  // order ourselves, which is only sound where ARG_NAMES has no entry because
  // the function is not an exported realm function to look up. A wrong order
  // there lands values in the wrong parameters silently: every MsgCall argument
  // is a string, so nothing downstream catches it.
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

/**
 * A tm2 JSON-RPC call against the node we are configured for.
 *
 * `error.message` is useless on tm2 — every failure comes back as the JSON-RPC
 * generic "Internal error" (-32603) and the real cause is in `error.data`
 * ("Could not find tx result for hash …", and so on). Reading `message` alone
 * turns every distinct failure into the same three words.
 */
async function rpc(endpoint: string, method: string, params: unknown[]): Promise<any> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // A string id, matching what tm2's own clients send.
    body: JSON.stringify({ jsonrpc: '2.0', id: `boards2-${Date.now()}`, method, params })
  })
  if (!response.ok) {
    throw new Error(`${method} failed: ${response.status} ${response.statusText}`)
  }
  const body = await response.json()
  if (body.error) {
    const detail = body.error.data ?? body.error.message ?? JSON.stringify(body.error)
    throw new Error(`${method} rejected: ${detail}`)
  }
  return body.result
}

/**
 * Broadcasts a `signtx` result straight to the chain's RPC, then confirms it.
 *
 * Deliberately *not* `gnonative.broadcastTxCommit`, whose parameter is
 * `signedTxJson` — feeding it this blob would mean decoding the amino-binary the
 * wallet returned and re-encoding it as JSON, which is exactly what the standard
 * forbids. A session key or multisig signature carries fields a generic client
 * drops on that round trip, producing a well-formed-looking but invalid
 * transaction that fails at the last step and looks like the wallet's fault.
 * `signedtx` is already the base64 amino-binary these endpoints take, so the
 * bytes go over untouched and we never need to understand the signature.
 *
 * **`broadcast_tx_sync`, not `_commit`.** `_commit` holds the request open until
 * the transaction is in a block, and when that wait fails — a timeout, an
 * event-subscription problem — the RPC returns an error for a transaction that
 * was already delivered and goes on to commit perfectly well. Reporting failure
 * for a transaction that succeeded is the worst answer available. `_sync`
 * returns once the node has accepted it into the mempool, which is the part the
 * node can actually be definitive about.
 *
 * Acceptance is not landing, so we then poll `tx` by hash — the standard's own
 * guidance, that a broadcast result is a hint and a producer should confirm on
 * its own RPC. That also gives the caller a real "it is on chain" signal to
 * refetch against, which is what `_commit` was being used for.
 */
export const broadcastTxCommit = createAppAsyncThunk<void, string, ThunkExtra>(
  'tx/broadcastTxCommit',
  async (signedTx, thunkAPI) => {
    const gnonative = thunkAPI.extra.gnonative
    const remote = await gnonative.getRemote()
    const endpoint = /^https?:\/\//i.test(remote) ? remote : `http://${remote}`

    const accepted = await rpc(endpoint, 'broadcast_tx_sync', [signedTx])
    // CheckTx ran and refused it: bad signature, bad sequence, insufficient
    // funds. Nothing was committed and nothing will be.
    if (accepted?.error) {
      throw new Error(`Transaction rejected: ${JSON.stringify(accepted.error)}`)
    }
    const hash = accepted?.hash
    if (!hash) {
      throw new Error('Broadcast returned no transaction hash.')
    }

    // Poll rather than assume. Until it appears in a block it has not happened,
    // and a screen that refetches before then shows the user their own change
    // missing.
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      let committed
      try {
        committed = await rpc(endpoint, 'tx', [hash])
      } catch {
        continue // not indexed yet; `tx` reports a miss as an error
      }
      // Accepted into a block and still failed on execution — out of gas, a
      // realm that refused the call. The user is owed that difference.
      const failure = committed?.tx_result?.ResponseBase?.Error
      if (failure) {
        throw new Error(`Transaction failed on chain: ${JSON.stringify(failure)}`)
      }
      console.log('broadcast committed: height=%s hash=%s', String(committed?.height), hash)
      return
    }

    throw new Error(`Transaction ${hash} was accepted but has not appeared in a block. It may still land.`)
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
      state.signedTx = undefined
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

      // `signedtx` is base64 amino-binary — the exact parameter
      // broadcast_tx_commit takes. The standard requires we treat it as opaque
      // and broadcast it unmodified: decoding and re-encoding needs a client
      // able to represent whatever scheme the wallet signed with, and a session
      // key or multisig carries fields a generic client drops, producing a
      // well-formed-looking but invalid transaction that fails at the last step
      // and looks like the wallet's fault. So it is stored exactly as received.
      if (q.signedtx) {
        state.signedTx = q.signedtx as string
      }

      if (q.chainid || q.chain_id) state.chainId = (q.chainid ?? q.chain_id) as string
      if (q.remote) state.remoteURL = q.remote as string
    },
    clearLinking: (state) => {
      console.log('clearing linking data')
      state.failure = undefined
      state.signedTx = undefined
      state.bech32AddressSelected = undefined
      state.chainId = undefined
      state.remoteURL = undefined
    }
  },
  selectors: {
    selectLinkingFailure: (state: State) => state.failure,
    selectSignedTx: (state: State) => state.signedTx as string | undefined,
    selectBech32AddressSelected: (state: State) => state.bech32AddressSelected as string | undefined,
    selectChainId: (state: State) => state.chainId as string | undefined,
    selectRemoteURL: (state: State) => state.remoteURL as string | undefined
  }
})

export const { clearLinking, setLinkingData } = linkingSlice.actions

export const { selectLinkingFailure, selectSignedTx, selectBech32AddressSelected, selectChainId, selectRemoteURL } =
  linkingSlice.selectors
