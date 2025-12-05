import { Text } from '@berty/gnonative-ui'
import { StyleSheet } from 'react-native'
import { LoadingSkeleton } from '../skeleton'

type Props = { count: number; loading?: boolean }

export const ThreadCount = ({ count, loading }: Props) => {
  if (loading) {
    return <LoadingSkeleton />
  }
  return <Text.Caption style={styles.threadCount}>{count > 0 ? count : 0} threads</Text.Caption>
}

const styles = StyleSheet.create({
  threadCount: {
    fontWeight: '500',
    color: '#000'
  }
})
