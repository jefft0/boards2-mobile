import * as Linking from 'expo-linking'
import { useEffect } from 'react'
import { setLinkingData, useAppDispatch } from '@gno/redux'

const LinkingProvider = ({ children }: { children: React.ReactNode }) => {
  const url = Linking.useURL()

  const dispatch = useAppDispatch()

  useEffect(() => {
    ;(async () => {
      if (url) {
        const linkingParsedURL = Linking.parse(url)
        console.log('link url received', url)

        await dispatch(setLinkingData(linkingParsedURL))
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  return <>{children}</>
}

export { LinkingProvider }
