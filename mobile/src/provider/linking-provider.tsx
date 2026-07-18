import * as Linking from 'expo-linking'
import { useEffect } from 'react'
import { consumeState, setLinkingData, useAppDispatch } from '@gno/redux'

const LinkingProvider = ({ children }: { children: React.ReactNode }) => {
  const url = Linking.useURL()

  const dispatch = useAppDispatch()

  useEffect(() => {
    ;(async () => {
      if (url) {
        const linkingParsedURL = Linking.parse(url)
        console.log('link url received', url)

        // Reject unsolicited/forged callbacks: the callback scheme is public,
        // so only accept a `state` we issued (single-use). Callbacks without a
        // state are still accepted for backward compatibility.
        const state = linkingParsedURL.queryParams?.state as string | undefined
        if (state && !consumeState(state)) {
          console.warn('ignoring gnokey callback with unknown state')
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
