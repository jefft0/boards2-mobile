import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { Text } from '@berty/gnonative-ui'
import { Board } from '@gno/redux'
import { CreatedBy } from '../list/CreatedBy'

export interface BoardData {
  id: string
  title: string
  creator: string
  createdAt: string
  threadCount: number
  boardNumber: number
}

interface BoardCardProps {
  board: Board
  onPress: (board: Board) => void
}

export const BoardCard = ({ board, onPress }: BoardCardProps) => {
  // console.log('BoardCard board:', JSON.stringify(board))
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(board)}>
      <Text.Title3 style={styles.boardTitle}>{board.name}</Text.Title3>
      <CreatedBy creatorName={board?.creatorName?.name || 'unknown'} createdAt={board.createdAt} boardId={board.id.toString()} />
      <View style={styles.replyRepostContainer}>
        <Text.Caption style={styles.threadCount}>{board.n_threads > 0 ? board.n_threads : 0} threads</Text.Caption>
        <Text.Body color="#ccc" style={styles.divider}>
          •
        </Text.Body>
        {/* <Text.Label style={styles.threadCount}>{board.} replies</Text.Label> */}
        {/* <Text.Label style={styles.threadCount}>{board.threadCount} threads</Text.Label> */}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  boardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#266000'
  },
  threadCount: {
    marginTop: 4,
    fontWeight: '500',
    color: '#000'
  },
  divider: {
    marginHorizontal: 8
  },
  replyRepostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  }
})
