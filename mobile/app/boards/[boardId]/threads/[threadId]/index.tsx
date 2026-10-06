import { useLocalSearchParams } from 'expo-router'
import PostDetailScreen from '@gno/components/threads/PostDetailScreen'

// Show a thread and its comments. This matches the gnoweb render route "{board}/{thread}".
export default function ThreadDetailScreen() {
  const { boardId, threadId } = useLocalSearchParams<{ boardId: string; threadId: string }>()

  return <PostDetailScreen boardId={boardId} threadId={threadId} />
}
