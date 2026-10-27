import { Directory, File, Paths } from 'expo-file-system'

/**
 * Single-use `state` tokens issued with each GnoConnect launch link and expected
 * back on the callback.
 *
 * The callback scheme is public — anything installed can open
 * `land.gno.boards2:/…?status=success&address=…` — so a callback is trustworthy
 * only if it echoes a token we issued. Otherwise a forged one could set the
 * signed-in address or feed us a transaction to broadcast.
 *
 * Persisted, not held in memory: the round trip leaves the app, and the OS may
 * evict us meanwhile. An in-memory set would be empty on the cold start the
 * callback itself triggers, rejecting legitimate returns intermittently.
 */

const STORE = 'gnoconnect-callback-states.json'

/** Tokens older than this are dropped: a round trip is seconds, not hours. */
const TTL_MS = 15 * 60 * 1000

type Store = Record<string, number> // token -> issued-at epoch ms

const file = () => new File(new Directory(Paths.document), STORE)

const read = (): Store => {
  try {
    const f = file()
    if (!f.exists) return {}
    const parsed = JSON.parse(f.textSync()) as unknown
    return parsed && typeof parsed === 'object' ? (parsed as Store) : {}
  } catch {
    // A corrupt store must not wedge sign-in: start clean, rejecting callbacks
    // already in flight — the safe direction.
    return {}
  }
}

const write = (store: Store) => {
  try {
    const f = file()
    if (!f.exists) f.create({ intermediates: true })
    f.write(JSON.stringify(store))
  } catch (e) {
    console.warn('could not persist callback state tokens', e)
  }
}

const prune = (store: Store): Store => {
  const cutoff = Date.now() - TTL_MS
  return Object.fromEntries(Object.entries(store).filter(([, issued]) => issued >= cutoff))
}

/** Issues a token to send as `state`, and remembers it for the callback. */
export const issueState = (): string => {
  const bytes = new Uint8Array(16)
  const c = (globalThis as { crypto?: Crypto }).crypto
  if (c?.getRandomValues) c.getRandomValues(bytes)
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

  const store = prune(read())
  store[token] = Date.now()
  write(store)
  return token
}

/**
 * True if we issued this token and it hasn't been used or expired. Consumes it,
 * so a replayed callback is rejected.
 */
export const consumeState = (token: string): boolean => {
  const store = prune(read())
  const issued = store[token]
  if (issued === undefined) {
    write(store)
    return false
  }
  delete store[token]
  write(store)
  return true
}
