import { Image, View, StyleSheet } from 'react-native'
import {
  clearLinking,
  loggedIn,
  requestLoginForGnokeyMobile,
  selectAccount,
  selectBech32AddressSelected,
  selectLoginLoading,
  selectRemoteURL,
  useAppDispatch,
  useAppSelector
} from '@gno/redux'
import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { HomeLayout, Button, Ruller, Text } from '@berty/gnonative-ui'

export default function Root() {
  const dispatch = useAppDispatch()
  const route = useRouter()
  const bech32AddressSelected = useAppSelector(selectBech32AddressSelected)
  const remoteURL = useAppSelector(selectRemoteURL)
  const account = useAppSelector(selectAccount)
  const loading = useAppSelector(selectLoginLoading)

  useEffect(() => {
    if (loading || !bech32AddressSelected || !remoteURL) return
    console.log('bech32AddressSelected on index', bech32AddressSelected)

    dispatch(loggedIn())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bech32AddressSelected])

  useEffect(() => {
    if (loading) return
    if (account) {
      dispatch(clearLinking())
      route.replace('/home')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  const signinUsingGnokey = async () => {
    console.log('Requesting login for Gnokey Mobile...')
    await dispatch(requestLoginForGnokeyMobile()).unwrap()
  }

  return (
    <HomeLayout
      header={null}
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
