import { View, StyleSheet, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BoardsCreateHeader } from '../boards/BoardsCreateHeader'
import CreateThreadForm, { CreateThreadFormData } from '../threads/CreateThreadForm'

interface ThreadsCreateTemplateProps {
  breadcrumbItems: string[]
  onBackPress: () => void
  onCreate: (board: CreateThreadFormData) => void
}

export const ThreadsCreateTemplate = ({ breadcrumbItems, onBackPress, onCreate }: ThreadsCreateTemplateProps) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <BoardsCreateHeader
          title="Create Thread"
          onBackPress={onBackPress}
          breadcrumbItems={[...breadcrumbItems, 'CreateThread']}
        />
        <CreateThreadForm onCreate={onCreate} />
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
