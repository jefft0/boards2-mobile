import { PACKAGE_PATH } from '@gno/constants/Constants'
import { Post } from '@gno/types'
import { GnoNativeApi } from '@gnolang/gnonative'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { Buffer } from 'buffer'
import * as Linking from 'expo-linking'
import { ThunkExtra } from '@gno/redux'

// GnoConnect launch-link / callback conventions.
const GNOKEY_SCHEME = 'land.gno.gnokey'
const BOARDS2_CALLBACK = 'land.gno.boards2:/'

/**
 * Opaque, single-use `state` tokens we have issued to the wallet and expect
 * echoed back on the callback. Lets us reject unsolicited/forged callbacks —
 * the callback scheme is public, so anyone can open it. Kept in-module (the
 * round trip is within one app session); crypto-random so it can't be guessed.
 */
const expectedStates = new Set<string>()
const rememberState = (state: string) => expectedStates.add(state)

/** True (and consumes the token, single-use) if we issued this state. */
export const consumeState = (state: string): boolean => expectedStates.delete(state)

const generateState = (): string => {
  const bytes = new Uint8Array(16)
  const c = (globalThis as { crypto?: Crypto }).crypto
  if (c?.getRandomValues) c.getRandomValues(bytes)
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

interface State {
  txJsonSigned: string | undefined
  bech32AddressSelected: string | undefined
  chainId: string | undefined
  remoteURL: string | undefined
}

const initialState: State = {
  txJsonSigned: undefined,
  bech32AddressSelected: undefined,
  chainId: undefined,
  remoteURL: undefined
}

export const requestLoginForGnokeyMobile = createAsyncThunk<boolean>('tx/requestLoginForGnokeyMobile', async () => {
  // GnoConnect `connect`: display-level sign-in (no challenge/signature). The
  // wallet returns the address to our callback; `state` correlates the response.
  const state = generateState()
  rememberState(state)
  const url = new URL(`${GNOKEY_SCHEME}://connect`)
  url.searchParams.append('callback', `${BOARDS2_CALLBACK}/signin-callback`)
  url.searchParams.append('state', state)
  console.log('redirecting to: ', url)
  return await Linking.openURL(url.toString())
})

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

  // GnoConnect `tx` launch link in sign-only mode (broadcast=false): gnokey
  // builds the MsgCall from these params, the user reviews and signs, and
  // returns the signed tx to our callback (`signedtx`) for us to broadcast.
  // Positional `args` are accepted as a back-compat alias — gnokey resolves
  // declaration order via vm/qdoc. `signer` pins the account (from `connect`);
  // `state` correlates the response and rejects forged callbacks.
  const state = generateState()
  rememberState(state)

  const url = new URL(`${GNOKEY_SCHEME}://tx`)
  url.searchParams.append('path', packagePath)
  url.searchParams.append('func', fnc)
  for (const arg of args) url.searchParams.append('args', arg)
  if (send) url.searchParams.append('send', send)
  url.searchParams.append('rpc', await gnonative.getRemote())
  url.searchParams.append('chainid', await gnonative.getChainID())
  url.searchParams.append('signer', callerAddressBech32)
  url.searchParams.append('broadcast', 'false')
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
    const res = await gnonative.broadcastTxCommit(signedTx)
    console.log('broadcasted tx: ', JSON.stringify(res))
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
      state.txJsonSigned = undefined
      state.bech32AddressSelected = undefined
      state.chainId = undefined
      state.remoteURL = undefined
    })
  },
  reducers: {
    setLinkingData: (state, action) => {
      const q = action.payload.queryParams ?? {}

      // A failed sign-in / signing (user cancelled or wallet error): leave state
      // untouched so no stale address/tx is picked up.
      if (q.status && q.status !== 'success') {
        console.log('gnokey callback status:', q.status, q.message ?? '')
        return
      }

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
      state.txJsonSigned = undefined
      state.bech32AddressSelected = undefined
      state.chainId = undefined
      state.remoteURL = undefined
    }
  },
  selectors: {
    selectQueryParamsTxJsonSigned: (state: State) => state.txJsonSigned as string | undefined,
    selectBech32AddressSelected: (state: State) => state.bech32AddressSelected as string | undefined,
    selectChainId: (state: State) => state.chainId as string | undefined,
    selectRemoteURL: (state: State) => state.remoteURL as string | undefined
  }
})

export const { clearLinking, setLinkingData } = linkingSlice.actions

export const { selectQueryParamsTxJsonSigned, selectBech32AddressSelected, selectChainId, selectRemoteURL } =
  linkingSlice.selectors
