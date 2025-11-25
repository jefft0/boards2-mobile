import { Text } from '@berty/gnonative-ui'
import { StyleSheet } from 'react-native'

export const ThreadCount = ({ count }: { count: number }) => {
  return <Text.Caption style={styles.threadCount}>{count > 0 ? count : 0} threads</Text.Caption>
}

const styles = StyleSheet.create({
  threadCount: {
    fontWeight: '500',
    color: '#000'
  }
})
