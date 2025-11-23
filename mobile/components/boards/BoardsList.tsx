import { FlatList, View, StyleSheet, ActivityIndicator } from 'react-native'
import { BoardCard } from '../molecules/BoardCard'
import EmptyFeedList from '../feed/empty-feed-list'
import { Text } from '@berty/gnonative-ui'
import { Board } from '@gno/redux'
import { useTheme } from 'styled-components/native'

interface BoardsListProps {
  data: Board[]
  isLoading?: boolean
  sortBy?: string
  onBoardPress: (board: Board) => void
  onRefresh?: () => void
  refreshing?: boolean
}

export const BoardsList = ({
  data,
  isLoading,
  sortBy = 'oldest first',
  onBoardPress,
  onRefresh,
  refreshing
}: BoardsListProps) => {
  const theme = useTheme()
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.listContainer}>
      <View style={styles.sortContainer}>
        <Text.Body>
          Sort by: <Text.Label>{sortBy}</Text.Label>
        </Text.Body>
      </View>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <BoardCard board={item} onPress={onBoardPress} />}
        contentContainerStyle={styles.listContent}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={<EmptyFeedList message="No boards yet." />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1
  },
  centerContainer: {
    flexGrow: 1,
    justifyContent: 'center'
  },
  sortContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff'
  },
  listContent: {
    justifyContent: 'center'
  }
})
