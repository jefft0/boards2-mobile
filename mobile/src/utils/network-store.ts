import { Directory, File, Paths } from 'expo-file-system'
import { CUSTOM_NETWORK_ID, DEFAULT_NETWORK, findNetwork, Network } from '@gno/constants/networks'

/**
 * The network boards2 talks to, persisted across launches.
 *
 * As the GnoConnect producer, boards2 owns the rpc/chainid it names to the
 * wallet on every launch link, so this is where its network is decided. Reads
 * are synchronous: the value configures gnonative before the first render.
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

    // Presets are restored by id, not by stored endpoint: when a preset's rpc
    // changes (a testnet moves) the new value must reach whoever chose it long
    // ago. An id that no longer exists falls through to the default.
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
    // The selection still applies for this run, it just won't survive a restart.
    console.warn('could not persist the selected network', e)
  }
}
