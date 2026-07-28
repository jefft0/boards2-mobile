import { Platform } from 'react-native'

/**
 * A network is one unit: an RPC endpoint together with the chain ID that
 * endpoint serves.
 *
 * The two are never configured separately. An endpoint paired with the chain ID
 * of a *different* chain yields a signature that cannot land — the wallet signs
 * for one network while we broadcast to another — which is exactly the mismatch
 * `loggedIn` refuses. Keeping them in a single record means no UI can offer the
 * broken combination in the first place.
 */
export type Network = {
  /** Stable key, and what gets persisted. Never shown to the user. */
  id: string
  label: string
  /** May be scheme-less (`host:port`): GnoConnect wallets assume `http://`. */
  rpc: string
  chainId: string
}

/**
 * Loopback is relative to the device, not to the development machine. The
 * Android emulator reaches the host's loopback through the alias 10.0.2.2, while
 * the iOS simulator shares the host's network stack and dials 127.0.0.1
 * directly. A *physical* device reaches neither and needs the host's LAN address
 * — define a custom network for that.
 */
const LOCAL_RPC = Platform.OS === 'android' ? '10.0.2.2:26657' : '127.0.0.1:26657'

export const NETWORKS: readonly Network[] = [
  { id: 'topaz', label: 'Topaz testnet', rpc: 'https://rpc.topaz.testnets.gno.land', chainId: 'topaz-1' },
  { id: 'local', label: 'Local gnodev', rpc: LOCAL_RPC, chainId: 'dev' }
]

export const DEFAULT_NETWORK: Network = NETWORKS[0]

/** Marks a user-entered network, so it is restored verbatim rather than by id. */
export const CUSTOM_NETWORK_ID = 'custom'

export const findNetwork = (id: string): Network | undefined => NETWORKS.find((network) => network.id === id)
