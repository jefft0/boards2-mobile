import { View, StyleSheet, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BoardsCreateHeader } from '../boards/BoardsCreateHeader'
import CreateBoardForm from '../boards/CreateBoardForm'
import { BoardCreationData } from '@gno/redux'

interface BoardsCreateTemplateProps {
  breadcrumbItems: string[]
  onBackPress: () => void
  onCreate: (board: BoardCreationData) => void
  loading?: boolean
}

export const BoardsCreateTemplate = ({ breadcrumbItems, onBackPress, onCreate, loading }: BoardsCreateTemplateProps) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <BoardsCreateHeader
          title="Create Board"
          onBackPress={onBackPress}
          breadcrumbItems={[...breadcrumbItems, 'CreateBoard']}
        />
        <CreateBoardForm onCreate={onCreate} loading={loading} />
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
