import { View, StyleSheet, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BoardsCreateHeader } from '../boards/BoardsCreateHeader'
import CreateBoardForm from '../boards/CreateBoardForm'
import { BoardCreationData } from '@gno/redux'

interface BoardsCreateTemplateProps {
  breadcrumbItems: string[]
  onBackPress: () => void
  onCreate: (board: BoardCreationData) => void
  // data: Board[]
  // isLoading?: boolean
  // sortBy?: string
  // onCreateBoard: () => void
  // onListAdminUsers: () => void
  // onHelp: () => void
  // onBoardPress: (board: Board) => void
  // onRefresh?: () => void
  // refreshing?: boolean
}

export const BoardsCreateTemplate = ({
  breadcrumbItems,
  onBackPress,
  onCreate
  // data,
  // isLoading,
  // sortBy,
  // onCreateBoard,
  // onListAdminUsers,
  // onHelp,
  // onBoardPress,
  // onRefresh,
  // refreshing
}: BoardsCreateTemplateProps) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <BoardsCreateHeader title="Create Board" onBackPress={onBackPress} breadcrumbItems={breadcrumbItems} />
        <CreateBoardForm onCreate={onCreate} />
        {/* <BoardsList
          data={data}
          isLoading={isLoading}
          sortBy={sortBy}
          onBoardPress={onBoardPress}
          onRefresh={onRefresh}
          refreshing={refreshing}
        /> */}
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
