import { ErrCode } from '@gnolang/gnonative'

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
 * What each gnonative error code means to someone using the app.
 *
 * gnonative classifies the failures it recognises (`getGrpcError` in
 * service/api.go) and the code is the stable part — the prose around it is not,
 * so branch on this rather than on the message text.
 *
 * Most of these belong upstream rather than here, and gnolang/gnonative PR #231
 * moves them. Once that is released and the dependency here is bumped, this file
 * becomes patches/describe-error.post-gnonative-231.ts, which was verified
 * end-to-end against a local build of that PR: the map shrinks to the two
 * entries naming a boards2 screen, passed as `overrides` to the library's
 * `describeErrCode`, and `UNREACHABLE` below goes away.
 */
const ERR_CODE_MESSAGES: Partial<Record<ErrCode, string>> = {
  [ErrCode.ErrOutOfGas]: 'The transaction ran out of gas. Try again with a higher gas limit.',
  [ErrCode.ErrGasOverflow]: 'The gas limit for this transaction is not valid.',
  [ErrCode.ErrInvalidGasWanted]: 'The gas limit for this transaction is not valid.',
  [ErrCode.ErrInsufficientFunds]: 'Not enough funds to cover the transaction fee.',
  [ErrCode.ErrInsufficientFee]: 'The fee offered is too low for this transaction.',
  [ErrCode.ErrInsufficientCoins]: 'Not enough funds for that amount.',
  [ErrCode.ErrUnauthorized]: 'The chain rejected this transaction as unauthorised.',
  [ErrCode.ErrInvalidSequence]: 'This transaction was out of date. Try again.',
  [ErrCode.ErrUnknownRequest]: 'The realm does not recognise that call.',
  [ErrCode.ErrUnknownAddress]: 'That account is not known on this chain.',
  [ErrCode.ErrInvalidAddress]: 'That account address is not valid.',
  [ErrCode.ErrInvalidPubKey]: 'That account key is not valid for this chain.',
  [ErrCode.ErrNoActiveAccount]: 'No account is active. Sign in again.',
  [ErrCode.ErrCryptoKeyNotFound]: 'The signing key could not be found.',
  [ErrCode.ErrDecryptionFailed]: 'Could not unlock the key.',
  [ErrCode.ErrTxDecode]: 'The signed transaction could not be read.',
  [ErrCode.ErrMemoTooLarge]: 'The message is too long for one transaction.',
  [ErrCode.ErrSetRemote]: 'That RPC address could not be used. Check it in the network settings.'
}

/** Reads the `ErrName(#211)` marker gnonative embeds in the message text. */
const parseErrCode = (message: string): ErrCode | undefined => {
  const match = message.match(/\(#(\d+)\)/)
  if (!match) return undefined
  const code = Number(match[1])
  return Number.isFinite(code) ? (code as ErrCode) : undefined
}

/**
 * TEMPORARY: matches transport failures by their English text, because
 * gnonative 5.0.1 does not classify them. Verified on device that PR #231
 * replaces this with `ErrCode.ErrRemoteUnreachable`; delete it on release.
 */
const UNREACHABLE = /connection refused|dial tcp|no such host|unable to send request|network is unreachable|timeout/i

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
  const code = parseErrCode(raw)
  if (code !== undefined) {
    const known = ERR_CODE_MESSAGES[code]
    if (known) return known
  }

  if (UNREACHABLE.test(raw)) {
    return 'Cannot reach the network. Check the RPC address in the network settings, or your connection.'
  }

  const cleaned = stripBridgeNoise(raw)
  if (!cleaned) return fallback

  // A realm's own rejection reason is worth showing in full; a runaway internal
  // dump is not, and would push everything else out of the snackbar.
  return cleaned.length > 200 ? `${cleaned.slice(0, 197)}…` : cleaned
}
