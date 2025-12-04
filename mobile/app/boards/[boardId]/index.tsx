import { CustomFlatList } from '@gno/components/list/CustomFlatList'
import { ThreadHeader } from '@gno/components/threads/ThreadHeader'
import ThreadCard from '@gno/components/threads/ThreadCard'
import { BREADCRUMBS } from '@gno/constants/Constants'
import {
  selectThreads,
  selectThreadBoard,
  selectThreadLoading,
  useAppSelector,
  selectCanCreateThread,
  useAppDispatch,
  loadThreads,
  setThreadToReply
} from '@gno/redux'
import { Post } from '@gno/types'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useState } from 'react'
import styled from 'styled-components/native'
import { ListEmptyView } from '@gno/components/list/ListEmptyView'

const Container = styled.View`
  padding-top: 40px;
  flex: 1;
  background-color: #ffffff;
`

export default function ThreadsPage() {
  // TODO: implement sortBy functionality
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sortBy, setSortBy] = useState('newest')
  const router = useRouter()
  const board = useAppSelector(selectThreadBoard)
  const loading = useAppSelector(selectThreadLoading)
  const { name } = useLocalSearchParams()
  const threads = useAppSelector(selectThreads)
  const canCreate = useAppSelector(selectCanCreateThread)
  const dispatch = useAppDispatch()

  const onRefresh = () => {
    if (!board) return
    dispatch(loadThreads({ board }))
  }

  // useFocusEffect(
  //   React.useCallback(() => {
  //     if (!board) return
  //     dispatch(loadThreads({ board }))
  //   }, [board, dispatch])
  // )

  const handleReply = (thread: Post) => {
    dispatch(setThreadToReply(thread))
    router.push(`/boards/${thread.boardId}/threads/${thread.id}/reply?title=${thread.title}`)
  }

  return (
    <Container>
      <ThreadHeader
        breadcrumbItems={[...BREADCRUMBS, name.toString()]}
        canCreate={canCreate}
        onCreateThread={() => router.push(`/boards/${board?.id}/new-thread`)}
        title={name.toString()}
        onBackPress={() => router.back()}
        creatorName={board?.creatorName?.name || 'unknown'}
        threadCount={board?.n_threads || 0}
        loading={loading}
      />

      <CustomFlatList<Post>
        data={threads}
        isLoading={loading}
        sortBy={sortBy}
        onRefresh={onRefresh}
        refreshing={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item: thread }) => (
          <ThreadCard
            thread={thread}
            onReply={() => handleReply(thread)}
            onOpen={() => router.push(`/boards/${thread.boardId}/threads/${thread.id}`)}
          />
        )}
        emptyComponent={<ListEmptyView message="No Threads yet." />}
      />
    </Container>
  )
}
