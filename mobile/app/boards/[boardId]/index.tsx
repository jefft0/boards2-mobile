import { CustomFlatList } from '@gno/components/list/CustomFlatList'
import { ThreadHeader } from '@gno/components/threads/ThreadHeader'
import ThreadCard from '@gno/components/threads/ThreadCard'
import { BREADCRUMBS } from '@gno/constants/Constants'
import { selectThreads, selectThreadBoard, selectThreadLoading, useAppSelector, selectCanCreateThread } from '@gno/redux'
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
  const [sortBy, setSortBy] = useState('newest')
  const router = useRouter()
  const board = useAppSelector(selectThreadBoard)
  const loading = useAppSelector(selectThreadLoading)
  const { name } = useLocalSearchParams()
  const feed = useAppSelector(selectThreads)
  const canCreate = useAppSelector(selectCanCreateThread)

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
      />

      <CustomFlatList<Post>
        data={feed}
        isLoading={loading}
        sortBy={sortBy}
        onBoardPress={() => {}}
        onRefresh={() => {}}
        refreshing={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item: thread }) => <ThreadCard thread={thread} />}
        emptyComponent={<ListEmptyView message="No Threads yet." />}
      />
    </Container>
  )
}
