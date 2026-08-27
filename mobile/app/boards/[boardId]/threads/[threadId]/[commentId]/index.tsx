import { useLocalSearchParams } from 'expo-router'
import PostDetailScreen from '@gno/components/threads/PostDetailScreen'

// Show a comment and its replies. This matches the gnoweb render route
// "{board}/{thread}/{reply}", which addresses a comment or reply at any depth.
export default function CommentDetailScreen() {
  const { boardId, threadId, commentId } = useLocalSearchParams<{
    boardId: string
    threadId: string
    commentId: string
  }>()

  return <PostDetailScreen boardId={boardId} threadId={threadId} commentId={commentId} />
}
