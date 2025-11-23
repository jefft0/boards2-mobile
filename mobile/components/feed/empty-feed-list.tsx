import { StyleSheet, View } from 'react-native'
import Text from '../text'

function EmptyFeedList({ message = 'No data yet.' }: { message?: string }) {
  return (
    <View style={styles.container}>
      <Text.Subheadline style={styles.text}>{message}</Text.Subheadline>
    </View>
  )
}

export default EmptyFeedList

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120
  },
  text: {
    fontSize: 20
  }
})
