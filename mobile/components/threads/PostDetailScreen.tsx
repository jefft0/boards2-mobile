import React, { useCallback, useEffect, useState } from 'react'
import { ScrollView, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import styled from 'styled-components/native'
import {
  broadcastTxCommit,
  clearLinking,
  detailKey,
  loadThreadDetail,
  selectCommentDetail,
  selectSignedTx,
  selectThreadBoard,
  selectThreadById,
  selectThreadDetail,
  selectThreadDetailLoading,
  selectThreadReplies,
  setReplyTarget,
  setThreadToRepost,
  threadReplyAndRedirectToSign,
  useAppDispatch,
  useAppSelector
} from '@gno/redux'
import { usePathname, useRouter } from 'expo-router'
import { BREADCRUMBS } from '@gno/constants/Constants'
import { PostBase } from '@gno/types'
import { ThreadHeaderSmall } from '@gno/components/threads/ThreadHeaderSmall'
import ThreadCardDetails from '@gno/components/threads/cards/ThreadCardDetails'
import ThreadCardReply from '@gno/components/threads/cards/ThreadCardReply'

const Container = styled.View`
  flex: 1;
  background-color: #f5f5f5;
`

const ThreadCard2 = styled.View`
  background-color: #ffffff;
  padding: 16px;
  margin-bottom: 8px;
`

const ThreadContent = styled.Text`
  font-size: 15px;
  color: #333333;
  line-height: 22px;
  margin-bottom: 12px;
`

const SmallAvatarText = styled.Text`
  color: #ffffff;
  font-weight: 600;
  font-size: 11px;
`

const InputContainer = styled.View`
  background-color: #ffffff;
  padding: 12px 16px;
  border-top-width: 1px;
  border-top-color: #e5e5e5;
  flex-direction: row;
  align-items: center;
`

const InputAvatar = styled.View`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: #d1d5db;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
`

const Input = styled.TextInput`
  flex: 1;
  background-color: #f5f5f5;
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
  margin-right: 8px;
`

const SendButton = styled.TouchableOpacity`
  background-color: ${(props) => (props.disabled ? '#d1d5db' : '#16a34a')};
  padding: 10px 20px;
  border-radius: 20px;
`

const SendButtonText = styled.Text`
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
`

const SectionHeader = styled.View`
  background-color: #f5f5f5;
  padding: 12px 16px;
`

const SectionTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
`

interface Props {
  boardId: string
  threadId: string
  // When given, show this comment and its replies instead of the thread and its
  // comments. The realm addresses a comment or reply at any depth by its ID, so
  // this same screen shows every level.
  commentId?: string
}

export default function PostDetailScreen({ boardId, threadId, commentId }: Props) {
  const key = detailKey(boardId, threadId, commentId)

  const thread = useAppSelector((state) => selectThreadDetail(state, key))
  const comment = useAppSelector((state) => selectCommentDetail(state, key))
  const replies = useAppSelector((state) => selectThreadReplies(state, key))
  const loading = useAppSelector((state) => selectThreadDetailLoading(state, key))
  const board = useAppSelector(selectThreadBoard)
  const signedTxFromWallet = useAppSelector(selectSignedTx)

  // Use the cache to avoid name flashes when refreshing. It misses for a thread
  // of another board, like the one a repost points at.
  const threadCache = useAppSelector((state) => selectThreadById(state, boardId, threadId))
  // Only a thread has a title and can be a repost, so keep it apart from the head
  // shown at the top of the screen, which is a thread or a comment.
  const threadSummary = commentId ? undefined : (threadCache ?? thread)
  const head: PostBase | undefined = commentId ? comment : threadSummary

  const dispatch = useAppDispatch()
  const router = useRouter()
  const callbackPath = usePathname()

  const [replyText, setReplyText] = useState('')

  // A reply to the thread itself has no parent comment, which the realm's
  // CreateReply takes as a zero reply ID.
  const replyTarget = {
    boardId: Number(boardId),
    threadId: Number(threadId),
    replyId: commentId ? Number(commentId) : 0
  }

  useEffect(() => {
    onRefresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, boardId, commentId, dispatch])

  const onRefresh = useCallback(async () => {
    console.log('Refreshing thread details...')
    await dispatch(
      loadThreadDetail({
        threadId: Number(threadId),
        boardId: Number(boardId),
        commentId: commentId ? Number(commentId) : undefined
      })
    )
  }, [threadId, boardId, commentId, dispatch])

  const handleSendReply = () => {
    if (head && replyText.trim()) {
      dispatch(setReplyTarget(replyTarget))
      dispatch(threadReplyAndRedirectToSign({ replyBody: replyText, callbackPath }))
    }
  }

  const navigateToReplyScreen = () => {
    if (!head) return
    dispatch(setReplyTarget(replyTarget))
    router.push(
      commentId
        ? `/boards/${boardId}/threads/${threadId}/${commentId}/reply`
        : `/boards/${boardId}/threads/${threadId}/reply?title=${threadSummary?.title || ''}`
    )
  }

  const handleRepost = () => {
    if (!threadSummary) return
    dispatch(setThreadToRepost(threadSummary))
    router.push(`/boards/${threadSummary.boardId}/threads/${threadSummary.id}/repost`)
  }

  // hook to handle the signed tx from the Gnokey and broadcast it
  useEffect(() => {
    const handleSignedTx = async () => {
      if (signedTxFromWallet) {
        const signedTx = signedTxFromWallet as string // opaque base64 amino-binary; broadcast unmodified
        console.log('signedTx: ', signedTx)

        try {
          await dispatch(clearLinking())
          await dispatch(broadcastTxCommit(signedTx))
          setReplyText('')
          setTimeout(() => {
            onRefresh()
          }, 2000)
        } catch (error) {
          console.error('on broadcastTxCommit', error)
        }
      }
    }
    handleSignedTx()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedTxFromWallet])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <Container>
        {/* TODO: board is the board we navigated from, so a thread of another board,
            like the one a repost points at, shows the wrong name and creator here. */}
        <ThreadHeaderSmall
          breadcrumbItems={[...BREADCRUMBS, board?.name || '', threadId, ...(commentId ? [commentId] : [])]}
          title={commentId ? `Reply ${commentId}` : `Thread ${threadId}`}
          onBackPress={() => router.back()}
          creatorName={board?.creatorName?.name || 'unknown'}
          createdDate={head?.createdAt}
          loading={loading}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 20}
        >
          <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}>
            {/* The thread or comment this screen is showing */}
            <ThreadCardDetails
              loading={loading}
              threadId={commentId || threadId}
              threadTitle={threadSummary?.title || ''}
              threadBody={head?.body || ''}
              threadReplyCount={head?.n_replies || 0}
              threadRepostCount={threadSummary?.n_reposts || 0}
              threadCreatorName={head?.user.name || ''}
              threadCreatedAt={head?.createdAt || ''}
              isRepost={!!threadSummary?.originalBoardId}
              threadOriginal={threadSummary?.repost_parent}
              onReply={navigateToReplyScreen}
              onRepost={commentId ? undefined : handleRepost}
              onOpenOriginal={() =>
                router.push(`/boards/${threadSummary?.originalBoardId}/threads/${threadSummary?.originalThreadId}`)
              }
            />

            {/* Replies Section */}
            <SectionHeader>
              <SectionTitle>{loading ? 'Loading Replies...' : 'Replies'}</SectionTitle>
            </SectionHeader>

            {replies.length === 0 && !loading && (
              <ThreadCard2>
                <ThreadContent>No replies yet. Be the first to reply!</ThreadContent>
              </ThreadCard2>
            )}

            {replies.map((reply) => (
              <ThreadCardReply
                key={reply.id}
                loading={false}
                post={reply}
                onReply={() => {}}
                onOpen={() => router.push(`/boards/${boardId}/threads/${threadId}/${reply.id}`)}
              />
            ))}
          </ScrollView>

          {/* Reply Input */}
          <InputContainer>
            <InputAvatar>
              <SmallAvatarText>U</SmallAvatarText>
            </InputAvatar>
            <Input placeholder="Post your reply..." value={replyText} onChangeText={setReplyText} multiline maxLength={500} />
            <SendButton onPress={handleSendReply} disabled={!replyText.trim()}>
              <SendButtonText>Send</SendButtonText>
            </SendButton>
          </InputContainer>
        </KeyboardAvoidingView>
      </Container>
    </SafeAreaView>
  )
}
