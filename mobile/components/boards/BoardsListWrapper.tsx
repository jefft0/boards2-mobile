import { BoardsList } from './BoardsList'
import { selectAccount, useAppSelector } from '@gno/redux'
import { useFeed } from '@gno/hooks/use-feed'
import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { Post } from '@gno/types'

const BoardsListWrapper = () => {
  const pageSize = 9
  const subtractOrZero = (a: number, b: number) => Math.max(0, a - b)
  const account = useAppSelector(selectAccount)
  const feed = useFeed()

  const [totalPosts, setTotalPosts] = useState(0)
  const [loading, setIsLoading] = useState(false)
  const [startIndex, setStartIndex] = useState(subtractOrZero(totalPosts, pageSize))
  const [endIndex, setEndIndex] = useState(totalPosts)
  const [limit, setLimit] = useState(pageSize + 1)
  const [data, setData] = useState<Post[]>([])
  const [isEndReached, setIsEndReached] = useState(false)
  const [error, setError] = useState<unknown | Error | undefined>(undefined)

  useEffect(() => {
    fetchCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  const fetchCount = async () => {
    try {
      if (!account) return
      const total = await feed.fetchCount(account.bech32)
      setTotalPosts(total)
      fetchData(account.bech32)
    } catch (error) {
      Alert.alert('Error while fetching posts.', ' ' + error)
      console.error(error)
    }
  }

  const fetchData = async (bech32: string) => {
    setIsLoading(true)
    try {
      console.log('fetching data from %d to %d', startIndex, endIndex)
      const result = await feed.fetchThreadPosts(bech32, startIndex, endIndex)
      setLimit(result.n_posts)
      setStartIndex(subtractOrZero(startIndex, pageSize))
      setEndIndex(startIndex)
      setData([...data, ...result.data])
      console.log('startIndex: %s, limit: %s', startIndex, limit, result.data.length)
      setIsEndReached(endIndex <= 0)
    } catch (error: unknown | Error | any) {
      // TODO: Check if this is the correct error message to handle and if it's the correct way to handle it
      // https://github.com/gnolang/gnonative/issues/117
      if (error.message === '[unknown] invoke bridge method error: unknown: posts for userPostsAddr do not exist') {
        setData([])
        return
      } else {
        console.error(error)
        setError('' + error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBoardPress = (board: Post) => {
    console.log('Board pressed:', board)
    // Handle board press action, e.g., navigate to board details
  }

  const handleRefresh = async () => {
    if (!account) return
    setData([])
    setStartIndex(subtractOrZero(totalPosts, pageSize))
    setEndIndex(totalPosts)
    await fetchData(account.bech32)
  }

  return null
  //   return <BoardsList boards={data} onBoardPress={handleBoardPress} onRefresh={handleRefresh} refreshing={loading} />
}

export default BoardsListWrapper
