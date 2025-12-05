import { View, StyleSheet, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import CreateThreadForm, { CreateThreadFormData } from '../threads/CreateThreadForm'
import { ThreadCreateHeader } from '../threads/ThreadCreateHeader'

interface ThreadsCreateTemplateProps {
  breadcrumbItems: string[]
  onBackPress: () => void
  onCreate: (board: CreateThreadFormData) => void
  loading: boolean
}

export const ThreadsCreateTemplate = ({ breadcrumbItems, onBackPress, onCreate, loading }: ThreadsCreateTemplateProps) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ThreadCreateHeader
          title="Create Thread"
          onBackPress={onBackPress}
          breadcrumbItems={[...breadcrumbItems, 'CreateThread']}
        />
        <CreateThreadForm onCancel={onBackPress} onCreate={onCreate} loading={loading} />
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
