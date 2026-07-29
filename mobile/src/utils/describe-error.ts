import { ErrCode } from '@gnolang/gnonative'

/**
 * Turns any failure into one sentence the user can act on.
 *
 * Everything the user sees routes through here, so wording stays consistent
 * across the wallet, a broadcast and a query, and nothing reaches the UI as a
 * raw stack or `[object Object]`.
 */

/** A non-success GnoConnect callback (`status` plus the enumerated `code`). */
export type LinkingFailure = { status: string; code?: string }

/**
 * `code` is the spec's machine-readable reason, never prose, so it is mapped
 * rather than shown. The set is open, so an unrecognised one must still say
 * something useful.
 */
export const describeLinkingFailure = (failure: LinkingFailure): string => {
  if (failure.status === 'cancelled') return 'Cancelled in the wallet.'

  switch (failure.code) {
    case 'network_declined':
      return 'The wallet stayed on its own network. This app needs it on the network selected here.'
    case 'no_signer':
      return 'The wallet has no account to sign with.'
    case 'signer_unavailable':
      return 'The wallet cannot act as the requested account.'
    case 'invalid_request':
      return 'The wallet rejected the request as malformed.'
    case 'unsupported_host':
      return 'This wallet does not support the requested action.'
    case 'tx_failed':
      // Per the spec, `tx_failed` does not guarantee nothing landed, so this
      // must not claim the action was undone.
      return 'The wallet could not complete the transaction.'
    default:
      return failure.code ? `The wallet reported an error (${failure.code}).` : 'The wallet reported an error.'
  }
}

const rawMessage = (error: unknown): string => {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  // RTK serialises a rejection to a plain object, so `instanceof` no longer
  // holds by the time this runs in middleware.
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return ''
}

/**
 * Wording that differs from gnonative's, because it names a boards2 screen.
 *
 * What went wrong arrives from the library with the code and is not restated
 * here; only the remedy is ours to give, since only this app knows it has a
 * network settings screen.
 */
const OVERRIDES: Partial<Record<ErrCode, string>> = {
  [ErrCode.ErrRemoteUnreachable]: 'Cannot reach the network. Check the RPC address in the network settings, or your connection.',
  [ErrCode.ErrSetRemote]: 'That RPC address could not be used. Check it in the network settings.'
}

/**
 * The ErrCode a serialised rejection carries, or undefined. `serializeGnoError`
 * puts it on `code` as a string, RTK keeping that property only when it is one.
 * This is the whole of the parsing: no message text is matched.
 */
const codeOf = (error: unknown): ErrCode | undefined => {
  if (!error || typeof error !== 'object') return undefined
  const code = (error as { code?: unknown }).code
  if (typeof code !== 'string') return undefined
  const parsed = Number(code)
  return Number.isInteger(parsed) && parsed in ErrCode ? (parsed as ErrCode) : undefined
}

/**
 * Framing added by the layers a failure crosses: connect-es renders a
 * ConnectError as "[code] message", Go's connect as "code: message", and
 * gnonative's bridge names the failing call. It nests — an uncoded rejection
 * arrives as "[unknown] stream receive error: unknown: thread body is required".
 *
 * Only gnonative's three contexts and connect's `unknown` are listed: a pattern
 * loose enough for any "word:" would eat a realm message that names itself.
 */
const FRAMING = /^(?:\[unknown\]|unknown:|(?:invoke|stream) bridge method error:|stream receive error:)\s*/i

/**
 * Strips that framing from a message that arrived without a code — anything
 * gnonative classified is already readable. Repeated because the layers nest and
 * each pass strips one.
 */
const stripBridgeNoise = (message: string) => {
  let stripped = message.trim()
  for (;;) {
    const next = stripped.replace(FRAMING, '').trim()
    if (next === stripped) return stripped
    stripped = next
  }
}

/** Whatever a rejected thunk carried, reduced to one sentence for the user. */
export const describeError = (error: unknown, fallback = 'Something went wrong.'): string => {
  // Our wording first, where the library has nothing to say.
  const code = codeOf(error)
  if (code !== undefined) {
    const override = OVERRIDES[code]
    if (override) return override
  }

  // Otherwise the message is gnonative's own wording for the code, written for a
  // person — see serializeGnoError.
  const raw = rawMessage(error).trim()
  if (!raw) return fallback

  const cleaned = stripBridgeNoise(raw)
  if (!cleaned) return fallback

  // A rejection reason is worth showing in full; a runaway dump would push
  // everything else out of the snackbar.
  const shortened = cleaned.length > 200 ? `${cleaned.slice(0, 197)}…` : cleaned

  // ErrChainRejected's text is the realm's, chosen by whoever deployed it.
  // Attributing it keeps a realm from putting "enter your recovery phrase to
  // continue" in the app's own voice.
  return code === ErrCode.ErrChainRejected ? `The chain replied: ${shortened}` : shortened
}
