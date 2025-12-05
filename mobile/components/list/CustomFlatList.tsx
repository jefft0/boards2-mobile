import { FlatList, View, StyleSheet, ListRenderItem } from 'react-native'
import { Text } from '@berty/gnonative-ui'

interface CustomFlatListProps<T> {
  data: T[]
  isLoading?: boolean
  renderItem: ListRenderItem<T>
  keyExtractor: (item: T, index: number) => string
  emptyComponent: React.ReactElement
  sortBy?: string
  onRefresh?: () => void
  refreshing?: boolean
}

export const CustomFlatList = <T,>({
  data,
  isLoading,
  renderItem,
  keyExtractor,
  emptyComponent,
  sortBy = 'oldest first',
  onRefresh,
  refreshing
}: CustomFlatListProps<T>) => {
  return (
    <View style={styles.listContainer}>
      <View style={styles.sortContainer}>
        <Text.Label>{isLoading ? 'Loading...' : `Sort by: ${sortBy}`}</Text.Label>
      </View>
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={emptyComponent}
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
