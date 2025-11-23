import { useState, useCallback } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'
import { BoardsTemplate } from '@gno/components/templates/BoardsTemplate'
import { PACKAGE_PATH } from '@gno/constants/Constants'
import { getListedBoards, selectBoards, selectBoardsLoading, useAppDispatch, useAppSelector, Board } from '@gno/redux'
import { StyleSheet, View } from 'react-native'

export default function Page() {
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()

  const data = useAppSelector(selectBoards)
  const isLoading = useAppSelector(selectBoardsLoading)

  useFocusEffect(
    useCallback(() => {
      dispatch(getListedBoards({ startIndex: 0, endIndex: 10 }))
      return () => {
        // Do something when the screen is unfocused
        // Useful for cleanup functions
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    // await fetchBoards()
    setRefreshing(false)
  }

  const handleCreateBoard = () => {
    router.push('/boards/new')
  }

  const handleListAdminUsers = () => {
    router.push('/boards/admins')
  }

  const handleHelp = () => {
    router.push('/boards/help')
  }

  const handleBoardPress = (board: Board) => {
    router.push(`/boards/${board.id}`)
  }

  const breadcrumbItems = PACKAGE_PATH.replace('gno.land/', '').split('/')

  return (
    <View style={styles.container}>
      <BoardsTemplate
        breadcrumbItems={breadcrumbItems}
        data={data}
        isLoading={isLoading}
        sortBy="oldest first"
        onCreateBoard={handleCreateBoard}
        onListAdminUsers={handleListAdminUsers}
        onHelp={handleHelp}
        onBoardPress={handleBoardPress}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'stretch'
  },
  flatListContent: {
    paddingBottom: 60 // Adjust the value to ensure it's above the app menu
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center'
  },
  post: {
    position: 'absolute',
    width: 70,
    height: 70,
    bottom: 40,
    right: 20
  }
})
