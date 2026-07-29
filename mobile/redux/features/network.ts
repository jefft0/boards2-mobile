import { createAppAsyncThunk } from '../utils/async-thunk'
import { ThunkExtra } from '@gno/redux'
import { Network } from '@gno/constants/networks'
import { setActiveNetwork } from '@gno/utils/network-store'

/**
 * Point boards2 at another network.
 *
 * Switching invalidates the session: the connected address came from a `connect`
 * against the old chain, and every cached board, thread and user is that chain's
 * state. Carried across, it reads as corrupted boards rather than as a settings
 * change, so redux-provider resets the whole store on `switchNetwork.fulfilled`.
 */
export const switchNetwork = createAppAsyncThunk<Network, Network, ThunkExtra>('network/switch', async (network, thunkAPI) => {
  const gnonative = thunkAPI.extra.gnonative

  await gnonative.setRemote(network.rpc)
  await gnonative.setChainID(network.chainId)
  setActiveNetwork(network)

  // The user cache lives outside redux, so the store reset does not reach it.
  thunkAPI.extra.userCache.invalidateCache()

  return network
})
