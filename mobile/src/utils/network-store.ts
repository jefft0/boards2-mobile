import { Directory, File, Paths } from 'expo-file-system'
import { CUSTOM_NETWORK_ID, DEFAULT_NETWORK, findNetwork, Network } from '@gno/constants/networks'

/**
 * The network boards2 talks to, persisted across launches.
 *
 * boards2 is the GnoConnect *producer*: it owns the rpc/chainid it works against
 * and names them to the wallet on every launch link, so this is the single place
 * the app's network is decided. Reads are synchronous because the value is
 * needed to configure gnonative before the first render.
 */

const STORE = 'boards2-network.json'

const file = () => new File(new Directory(Paths.document), STORE)

let cached: Network | undefined

const readFromDisk = (): Network | undefined => {
  try {
    const f = file()
    if (!f.exists) return undefined

    const parsed = JSON.parse(f.textSync()) as Partial<Network> | null
    if (!parsed || typeof parsed !== 'object') return undefined

    // A preset is restored by id, not by its stored endpoint: if a preset's rpc
    // changes (a testnet moves, the emulator alias above) the new value must
    // reach a user who chose that preset long ago, rather than pinning them to
    // whatever it happened to be on the day they selected it. An id that no
    // longer exists falls through to the default.
    if (parsed.id && parsed.id !== CUSTOM_NETWORK_ID) return findNetwork(parsed.id)

    const { label, rpc, chainId } = parsed
    if (typeof rpc !== 'string' || typeof chainId !== 'string' || !rpc || !chainId) return undefined
    return { id: CUSTOM_NETWORK_ID, label: label ?? 'Custom', rpc, chainId }
  } catch {
    // A corrupt store must not wedge startup: fall back to the default network.
    return undefined
  }
}

export const getActiveNetwork = (): Network => {
  if (!cached) cached = readFromDisk() ?? DEFAULT_NETWORK
  return cached
}

export const setActiveNetwork = (network: Network) => {
  cached = network
  try {
    const f = file()
    if (!f.exists) f.create({ intermediates: true })
    f.write(JSON.stringify(network))
  } catch (e) {
    // In-memory selection still applies for this run; it just won't survive a
    // restart. Failing the switch outright would be the worse trade.
    console.warn('could not persist the selected network', e)
  }
}
