import { View, StyleSheet, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BoardsHeader } from '../boards/BoardsHeader'
import { Board } from '@gno/redux'
import { CustomFlatList } from '../list/CustomFlatList'
import { BoardCard } from '../boards/BoardCard'

interface BoardsTemplateProps {
  breadcrumbItems: string[]
  data: Board[]
  isLoading?: boolean
  sortBy?: string
  onCreateBoard: () => void
  onListAdminUsers: () => void
  onHelp: () => void
  onBoardPress: (board: Board) => void
  onRefresh?: () => void
  refreshing?: boolean
}

export const BoardsTemplate = ({
  breadcrumbItems,
  data,
  isLoading,
  sortBy,
  onCreateBoard,
  onListAdminUsers,
  onHelp,
  onBoardPress,
  onRefresh,
  refreshing
}: BoardsTemplateProps) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <BoardsHeader
          breadcrumbItems={breadcrumbItems}
          onCreateBoard={onCreateBoard}
          onListAdminUsers={onListAdminUsers}
          onHelp={onHelp}
        />
        <CustomFlatList<Board>
          data={data}
          isLoading={isLoading}
          sortBy={sortBy}
          onBoardPress={onBoardPress}
          onRefresh={onRefresh}
          refreshing={refreshing}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <BoardCard board={item} onPress={onBoardPress} />}
        />
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
