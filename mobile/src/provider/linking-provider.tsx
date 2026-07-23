import * as Linking from 'expo-linking'
import { useEffect } from 'react'
import { setLinkingData, useAppDispatch } from '@gno/redux'
import { consumeState } from '@gno/utils/callback-state'

const LinkingProvider = ({ children }: { children: React.ReactNode }) => {
  const url = Linking.useURL()

  const dispatch = useAppDispatch()

  useEffect(() => {
    ;(async () => {
      if (url) {
        const linkingParsedURL = Linking.parse(url)
        console.log('link url received', url)

        // Reject unsolicited/forged callbacks: the callback scheme is public —
        // anything installed can open `land.gno.boards2:/…` — so only accept a
        // callback echoing a single-use `state` we issued.
        //
        // A missing `state` must be rejected too, not waved through: every link
        // we open (connect and tx alike) sends one, so a callback without one
        // cannot be a reply to us. Exempting them would let a forger bypass the
        // whole check simply by omitting the parameter.
        const state = linkingParsedURL.queryParams?.state as string | undefined
        if (!state || !consumeState(state)) {
          console.warn('ignoring gnokey callback with missing or unknown state')
          return
        }

        await dispatch(setLinkingData(linkingParsedURL))
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  return <>{children}</>
}

export { LinkingProvider }
