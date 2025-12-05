import React, { useCallback, useEffect, useState } from 'react'
import { ScrollView, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import styled from 'styled-components/native'
import {
  broadcastTxCommit,
  clearLinking,
  selectQueryParamsTxJsonSigned,
  selectThreadBoard,
  selectThreadById,
  selectThreadReplies,
  setThreadToReply,
  threadReplyAndRedirectToSign,
  useAppDispatch,
  useAppSelector
} from '@gno/redux'
import { loadThreadDetail, selectThreadDetailLoading, selectThreadDetail } from '@gno/redux'
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router'
import { BREADCRUMBS } from '@gno/constants/Constants'
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

export default function ThreadDetailScreen() {
  const thread = useAppSelector(selectThreadDetail)
  const replies = useAppSelector(selectThreadReplies)
  const loading = useAppSelector(selectThreadDetailLoading)
  const board = useAppSelector(selectThreadBoard)
  const txJsonSigned = useAppSelector(selectQueryParamsTxJsonSigned)

  const { boardId, threadId } = useLocalSearchParams<{ boardId: string; threadId: string }>()
  // Use the cache to avoid name flashes when refreshing
  const threadCache = useAppSelector((state) => selectThreadById(state, threadId))

  const dispatch = useAppDispatch()
  const router = useRouter()
  const callbackPath = usePathname()

  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    onRefresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, boardId, dispatch])

  const onRefresh = useCallback(async () => {
    console.log('Refreshing thread details...')
    await dispatch(
      loadThreadDetail({
        threadId: Number(threadId),
        boardId: Number(boardId)
      })
    )
  }, [threadId, boardId, dispatch])

  const handleSendReply = () => {
    if (thread && replyText.trim()) {
      dispatch(setThreadToReply(thread))
      dispatch(threadReplyAndRedirectToSign({ replyBody: replyText, callbackPath }))
    }
  }

  const navigateToReplyScreen = () => {
    if (!thread) return
    dispatch(setThreadToReply(thread))
    router.push(`/boards/${thread.boardId}/threads/${thread.id}/reply?title=${thread.title}`)
  }

  // hook to handle the signed tx from the Gnokey and broadcast it
  useEffect(() => {
    const handleSignedTx = async () => {
      if (txJsonSigned) {
        const signedTx = decodeURIComponent(txJsonSigned as string)
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
  }, [txJsonSigned])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <Container>
        <ThreadHeaderSmall
          breadcrumbItems={[...BREADCRUMBS, board?.name || '', threadId]}
          title={`Thread ${threadId}`}
          onBackPress={() => router.back()}
          creatorName={board?.creatorName?.name || 'unknown'}
          createdDate={thread?.createdAt}
          loading={loading}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 20}
        >
          <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}>
            {/* Main Thread Post */}
            <ThreadCardDetails
              loading={loading}
              threadId={threadId}
              threadTitle={threadCache?.title || ''}
              threadBody={threadCache?.body || ''}
              threadReplyCount={thread?.n_replies || 0}
              threadCreatorName={threadCache?.user.name || ''}
              threadCreatedAt={threadCache?.createdAt || ''}
              thread={thread!}
              onReply={navigateToReplyScreen}
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
              <ThreadCardReply key={reply.id} loading={false} thread={reply} onReply={() => {}} />
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
