import { Text } from '@berty/gnonative-ui'
import { StyleSheet } from 'react-native'
import { LoadingSkeleton } from '../skeleton'

type Props = { count: number; readOnly: boolean; loading?: boolean }

export const ThreadCount = ({ count, readOnly, loading }: Props) => {
  if (loading) {
    return <LoadingSkeleton />
  }
  return (
    <Text.Caption style={styles.threadCount}>
      {count > 0 ? count : 0} threads{readOnly ? ', read-only' : ''}
    </Text.Caption>
  )
}

const styles = StyleSheet.create({
  threadCount: {
    fontWeight: '500',
    color: '#000'
  }
})
