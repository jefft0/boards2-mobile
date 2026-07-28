import { createAsyncThunk } from '@reduxjs/toolkit'
import { ThunkExtra } from '@gno/redux'
import { Network } from '@gno/constants/networks'
import { setActiveNetwork } from '@gno/utils/network-store'

/**
 * Point boards2 at another network.
 *
 * Switching invalidates the session. The connected address came from a `connect`
 * against the old chain, and every cached board, thread and user is that chain's
 * state; carrying any of it across renders one chain's data under another
 * chain's identity, which reads as corrupted boards rather than as a settings
 * change. The whole store is therefore reset on `switchNetwork.fulfilled` (see
 * redux-provider), which drops the account and sends the user back to sign in.
 */
export const switchNetwork = createAsyncThunk<Network, Network, ThunkExtra>('network/switch', async (network, thunkAPI) => {
  const gnonative = thunkAPI.extra.gnonative

  await gnonative.setRemote(network.rpc)
  await gnonative.setChainID(network.chainId)
  setActiveNetwork(network)

  // The user cache lives outside redux, so the store reset does not reach it.
  thunkAPI.extra.userCache.invalidateCache()

  return network
})
