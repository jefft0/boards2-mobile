import { View, StyleSheet } from 'react-native'
import { Link, Stack } from 'expo-router'
import { Text } from '@berty/gnonative-ui'

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <Text.LargeTitle>This screen doesn&apos;t exist.</Text.LargeTitle>
        <Link href="/home/boards" style={styles.link}>
          <Text.Body>Go to home screen</Text.Body>
        </Link>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16
  },
  link: {
    paddingVertical: 15
  }
})
