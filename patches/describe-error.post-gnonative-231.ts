import { describeErrCode, ErrCode, errCodeFromMessage } from '@gnolang/gnonative'

/**
 * Turns any failure into one sentence the user can act on.
 *
 * Everything the user should see routes through here, so wording stays
 * consistent whether the failure came from the wallet, from a broadcast, or from
 * a query — and so no failure reaches the UI as a raw stack or `[object Object]`.
 */

/** A non-success GnoConnect callback (`status` plus the enumerated `code`). */
export type LinkingFailure = { status: string; code?: string }

/**
 * `code` is the spec's machine-readable reason — never prose — so it has to be
 * mapped rather than shown. The set is open by design (new reasons are added to
 * `code`), so an unrecognised one must still say something useful.
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
      // Per the GnoConnect spec a `tx_failed` on the broadcasting host does not
      // guarantee nothing landed, so this must not claim the action was undone.
      return 'The wallet could not complete the transaction.'
    default:
      return failure.code ? `The wallet reported an error (${failure.code}).` : 'The wallet reported an error.'
  }
}

const rawMessage = (error: unknown): string => {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  // Redux Toolkit serialises a rejection into a plain object, so `instanceof`
  // does not hold by the time this runs in a reducer or middleware.
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return ''
}

/**
 * Wording that differs from gnonative's defaults because it names a boards2
 * screen.
 *
 * Everything else — what actually went wrong at the chain or transport level —
 * comes from the library, so the phrasing stays consistent across gno apps and
 * is not restated here. Only the remedy is ours to give, because only this app
 * knows it has a network settings screen to send someone to.
 */
const OVERRIDES: Partial<Record<ErrCode, string>> = {
  [ErrCode.ErrRemoteUnreachable]: 'Cannot reach the network. Check the RPC address in the network settings, or your connection.',
  [ErrCode.ErrSetRemote]: 'That RPC address could not be used. Check it in the network settings.'
}

/** Strips the bridge's framing from anything that has to be shown verbatim. */
const stripBridgeNoise = (message: string) =>
  message
    .replace(/^\[unknown\]\s*/i, '')
    .replace(/^invoke bridge method error:\s*/i, '')
    .replace(/^unknown:\s*/i, '')
    .trim()

/** Whatever a rejected thunk carried, reduced to one sentence for the user. */
export const describeError = (error: unknown, fallback = 'Something went wrong.'): string => {
  const raw = rawMessage(error).trim()
  if (!raw) return fallback

  // gnonative embeds its code in the message text, so it survives the
  // serialisation Redux Toolkit applies to a rejection before middleware sees it.
  const code = errCodeFromMessage(raw)
  if (code !== undefined) {
    const known = describeErrCode(code, OVERRIDES)
    if (known) return known
  }

  const cleaned = stripBridgeNoise(raw)
  if (!cleaned) return fallback

  // A realm's own rejection reason is worth showing in full; a runaway internal
  // dump is not, and would push everything else out of the snackbar.
  return cleaned.length > 200 ? `${cleaned.slice(0, 197)}…` : cleaned
}
