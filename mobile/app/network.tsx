import { useRouter } from 'expo-router'
import { NetworkTemplate } from '@gno/components/templates/NetworkTemplate'

export default function Page() {
  const router = useRouter()

  const goBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/')
    }
  }

  // Switching signs the user out, so there is nothing to go back to: the Guard
  // would bounce any authenticated screen to the sign-in page anyway.
  return <NetworkTemplate onBackPress={goBack} onSwitched={() => router.replace('/')} />
}
