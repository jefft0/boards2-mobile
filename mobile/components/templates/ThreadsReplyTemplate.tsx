import { View, StyleSheet, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThreadCreateHeader } from '../threads/ThreadCreateHeader'

interface Props {
  breadcrumbItems: string[]
  onBackPress: () => void
  title: string
  children?: React.ReactNode
}

export const ThreadsReplyTemplate = ({ title, breadcrumbItems, onBackPress, children }: Props) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ThreadCreateHeader title={title} onBackPress={onBackPress} breadcrumbItems={breadcrumbItems} />
        {children}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.select({ ios: 0, android: 25 })
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb'
  }
})
