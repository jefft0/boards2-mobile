import { useEffect } from 'react'
import { selectLinkingFailure, useAppSelector } from '@gno/redux'

/**
 * Runs `onFailure` when the wallet answers a launch link with anything but
 * success.
 *
 * A screen that opens the wallet has no other way to learn the round trip ended:
 * the answer arrives as a deep link into a screen that never lost focus, so a
 * `navigation` 'focus' listener does not fire, and the thunk that would have
 * rejected is never dispatched because nothing was signed. Without this a
 * declined request leaves the submit button spinning for good.
 */
export const useWalletFailure = (onFailure: () => void) => {
  const failure = useAppSelector(selectLinkingFailure)

  useEffect(() => {
    if (failure) onFailure()
    // `onFailure` is a new closure each render; depending on it would run this
    // on every render instead of on each new answer from the wallet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failure])
}
