import { Platform } from 'react-native'

/**
 * A network is one unit: an RPC endpoint with the chain ID it serves.
 *
 * Never configured separately. Paired with another chain's ID, the wallet signs
 * for one network while we broadcast to a second and the signature cannot land.
 * One record means no UI can offer that combination.
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
 * Loopback is relative to the device: the Android emulator reaches the host
 * through the alias 10.0.2.2, the iOS simulator shares the host's stack and
 * dials 127.0.0.1. A physical device reaches neither — use a custom network.
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
