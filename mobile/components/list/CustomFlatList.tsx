import { FlatList, View, StyleSheet, ActivityIndicator, ListRenderItem } from 'react-native'
import EmptyFeedList from '../feed/empty-feed-list'
import { Text } from '@berty/gnonative-ui'
import { useTheme } from 'styled-components/native'

interface CustomFlatListProps<T> {
  data: T[]
  isLoading?: boolean
  renderItem: ListRenderItem<T>
  keyExtractor: (item: T, index: number) => string
  sortBy?: string
  onBoardPress?: (item: T) => void
  onRefresh?: () => void
  refreshing?: boolean
}

export const CustomFlatList = <T,>({
  data,
  isLoading,
  renderItem,
  keyExtractor,
  sortBy = 'oldest first',
  onBoardPress,
  onRefresh,
  refreshing
}: CustomFlatListProps<T>) => {
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
        <Text.Label>
          Sort by: <Text.Label>{sortBy}</Text.Label>
        </Text.Label>
      </View>
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
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
