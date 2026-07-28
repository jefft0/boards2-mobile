import { Image, View, StyleSheet, TouchableOpacity } from 'react-native'
import {
  clearLinking,
  loggedIn,
  requestLoginForGnokeyMobile,
  selectAccount,
  selectBech32AddressSelected,
  selectLoginLoading,
  useAppDispatch,
  useAppSelector
} from '@gno/redux'
import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HomeLayout, Button, Ruller, Text } from '@berty/gnonative-ui'
import Icons from '@gno/components/icons'

export default function Root() {
  const dispatch = useAppDispatch()
  const route = useRouter()
  const insets = useSafeAreaInsets()
  const bech32AddressSelected = useAppSelector(selectBech32AddressSelected)
  const account = useAppSelector(selectAccount)
  const loading = useAppSelector(selectLoginLoading)

  useEffect(() => {
    // The GnoConnect `connect` callback returns the address (not a remote URL) —
    // boards2 already knows its own network — so login gates on the address only.
    if (loading || !bech32AddressSelected) return
    console.log('bech32AddressSelected on index', bech32AddressSelected)

    dispatch(loggedIn())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bech32AddressSelected])

  useEffect(() => {
    if (loading) return
    if (account) {
      dispatch(clearLinking())
      route.replace('/home/boards')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  const signinUsingGnokey = async () => {
    console.log('Requesting login for Gnokey Mobile...')
    await dispatch(requestLoginForGnokeyMobile()).unwrap()
  }

  return (
    <HomeLayout
      // `connect` names the network the wallet is asked to switch to, so the
      // network has to be selectable *before* signing in — the profile screen is
      // behind the auth guard, which is the one place it cannot help.
      header={
        // HomeLayout renders the header raw and only insets its footer, so the
        // status bar has to be cleared here or the icon sits under it.
        <View style={[styles.headerRow, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => route.navigate('/network')} hitSlop={12} accessibilityLabel="Network settings">
            <Icons.Network />
          </TouchableOpacity>
        </View>
      }
      footer={
        <View style={styles.footerContainer}>
          <Text.Body_Bold>Sign in using Gnokey Mobile:</Text.Body_Bold>
          <Button onPress={signinUsingGnokey} color="secondary">
            Sign in
          </Button>
          <View style={styles.dividerRow}>
            <Ruller style={styles.ruller} />
            <Text.Caption2 style={styles.caption}>or</Text.Caption2>
            <Ruller style={styles.ruller} />
          </View>
          <Button onPress={signinUsingGnokey} color="primary">
            Browse as Guest
          </Button>
        </View>
      }
    >
      <View style={styles.mainContainer}>
        <Image source={require('@assets/images/ios/AppIcon~ios-marketing.png')} style={styles.logo} />
        <View style={styles.titleContainer}>
          <Text.LargeTitle>Boards2</Text.LargeTitle>
          <View style={styles.subtitleContainer}>
            <Text.Body>Decentralized Boards on Gno.land</Text.Body>
            <Text.Body>Powered by GnoNative</Text.Body>
          </View>
        </View>
      </View>
    </HomeLayout>
  )
}

const styles = StyleSheet.create({
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8 // overridden with the safe-area inset at the call site
  },
  footerContainer: {
    gap: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 32
  },
  dividerRow: {
    height: 16,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row'
  },
  ruller: {
    flex: 1,
    width: 'auto'
  },
  caption: {
    marginHorizontal: 8
  },
  mainContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 16,
    resizeMode: 'contain'
  },
  titleContainer: {
    gap: 8,
    alignItems: 'center'
  },
  subtitleContainer: {
    gap: 4,
    alignItems: 'center'
  }
})
