import { useEffect, useState } from 'react'
import { useNavigation, usePathname, useRouter } from 'expo-router'
import Text from '@gno/components/text'
import {
  broadcastTxCommit,
  clearLinking,
  gnodTxAndRedirectToSign,
  replyTxAndRedirectToSign,
  selectAccount,
  selectPostToReply,
  selectQueryParamsTxJsonSigned,
  useAppDispatch,
  useAppSelector
} from '@gno/redux'
import Layout from '@gno/components/layout'
import TextInput from '@gno/components/textinput'
import { Spacer, Button } from '@berty/gnonative-ui'
import Alert from '@gno/components/alert'
import { PostRow } from '@gno/components/feed/post-row'
import { FlatList, KeyboardAvoidingView, View } from 'react-native'
import { Post } from '@gno/types'
import { setPostToReply } from '@gno/redux'
import { useFeed } from '@gno/hooks/use-feed'

function Page() {
  const [replyContent, setReplyContent] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState<string | undefined>(undefined)
  const [posting, setPosting] = useState<boolean>(false)
  const [thread, setThread] = useState<Post[]>([])

  const post = useAppSelector(selectPostToReply)
  const txJsonSigned = useAppSelector(selectQueryParamsTxJsonSigned)
  const account = useAppSelector(selectAccount)
  const navigation = useNavigation()

  const feed = useFeed()
  const router = useRouter()

  const pathName = usePathname()

  const dispatch = useAppDispatch()

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      await fetchData()
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation])

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post])

  useEffect(() => {
    ;(async () => {
      if (txJsonSigned) {
        console.log('txJsonSigned in [post_id] screen:', txJsonSigned)
        const signedTx = decodeURIComponent(txJsonSigned as string)
        try {
          dispatch(clearLinking())
          await dispatch(broadcastTxCommit(signedTx)).unwrap()
        } catch (error) {
          console.error('on broadcastTxCommit', error)
        } finally {
          fetchData()
        }
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txJsonSigned])

  const fetchData = async () => {
    if (!post) return

    console.log('fetching post: ', post.user.address)
    setLoading('Loading post...')
    try {
      let threadId = Number(post.id)
      let replyId = 0
      if (post.parent_id !== 0) {
        threadId = post.thread_id
        replyId = Number(post.id)
      }
      const thread = await feed.fetchThread(String(post.user.address), threadId, replyId)
      setThread(thread.data)
    } catch (error) {
      console.error('failed on [post_id].tsx screen', error)
      setError('' + error)
    } finally {
      setLoading(undefined)
    }
  }

  const onPressReply = async () => {
    if (!post) return

    setLoading(undefined)
    setError(undefined)
    setPosting(true)

    if (!account) throw new Error('No active account') // never happens, but just in case

    try {
      await dispatch(
        replyTxAndRedirectToSign({ post, replyContent, callerAddressBech32: account.bech32, callbackPath: pathName })
      ).unwrap()
      setReplyContent('')
      await fetchData()
    } catch (error) {
      console.error('on post screen', error)
      setError('' + error)
    } finally {
      setPosting(false)
    }
  }

  const onPressPost = async (p: Post) => {
    await dispatch(setPostToReply(p))
    router.navigate({ pathname: '/post/[post_id]' })
  }

  const onGnod = async (post: Post) => {
    if (!account) throw new Error('No active account')
    dispatch(gnodTxAndRedirectToSign({ post, callerAddressBech32: account.bech32, callbackPath: pathName }))
  }

  if (!post || !post.user) {
    return (
      <Layout.Container>
        <Layout.Header title="Post" iconType="back" />
        <Layout.Body>
          <Alert severity="error" message="Error while fetching posts, please, check the logs." />
        </Layout.Body>
      </Layout.Container>
    )
  }

  const title = post.title ? post.title : 'Post'
  return (
    <Layout.Container>
      <Layout.Header title={title} iconType="back" />
      <Layout.Body>
        <PostRow post={post} showFooter={false} />

        <View style={{ flex: 1 }}>
          {loading ? (
            <Text.Body style={{ flex: 1, textAlign: 'center', paddingTop: 42 }}>{loading}</Text.Body>
          ) : (
            <FlatList
              scrollToOverflowEnabled
              data={thread}
              keyExtractor={(item) => `${item.id}`}
              contentContainerStyle={{ width: '100%', paddingBottom: 20 }}
              renderItem={({ item }) => <PostRow post={item} onPress={onPressPost} onGnod={onGnod} />}
              onEndReachedThreshold={0.1}
            />
          )}
        </View>

        <Text.Body>Replying to {post?.user.name}</Text.Body>
        <Spacer />
        <KeyboardAvoidingView behavior="padding">
          <TextInput
            placeholder="Post your reply here..."
            onChangeText={setReplyContent}
            value={replyContent}
            autoCapitalize={'none'}
            textAlign="left"
            multiline
            numberOfLines={3}
            style={{ height: 80 }}
          />
          <Button loading={posting} color="primary" onPress={onPressReply}>
            Reply
          </Button>
          <Spacer space={16} />
          <Button onPress={() => router.back()} color="secondary">
            Back
          </Button>
          <Alert severity="error" message={error} />
          <Spacer space={16} />
        </KeyboardAvoidingView>
      </Layout.Body>
    </Layout.Container>
  )
}

export default Page
