import { useNavigation, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  BoardCreationData,
  broadcastTxCommit,
  clearLinking,
  createBoard,
  postTxAndRedirectToSign,
  selectAccount,
  selectQueryParamsTxJsonSigned,
  selectThreadBoard,
  threadCreate,
  useAppDispatch,
  useAppSelector
} from '@gno/redux'
import { BoardsCreateTemplate } from '@gno/components/templates/BoardsCreateTemplate'
import { BREADCRUMBS } from '@gno/constants/Constants'
import { ThreadsCreateTemplate } from '@gno/components/templates/ThreadsCreateTemplate'
import { CreateThreadFormData } from '@gno/components/threads/CreateThreadForm'

export default function Search() {
  const [threadTitle, setThreadTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [loading, setLoading] = useState(false)

  const navigation = useNavigation()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const account = useAppSelector(selectAccount)
  const board = useAppSelector(selectThreadBoard)

  // const sessionInMinutes = useAppSelector(selectSessionValidUntil);

  const txJsonSigned = useAppSelector(selectQueryParamsTxJsonSigned)

  // hook to handle the signed tx from the Gnokey and broadcast it
  useEffect(() => {
    const handleSignedTx = async () => {
      if (txJsonSigned) {
        const signedTx = decodeURIComponent(txJsonSigned as string)
        console.log('signedTx: ', signedTx)

        try {
          setLoading(true)
          await dispatch(clearLinking())
          await dispatch(broadcastTxCommit(signedTx))
          setTimeout(() => {
            router.push('home')
          }, 3000)
        } catch (error) {
          console.error('on broadcastTxCommit', error)
          // setError('' + error)
        }
      }
    }
    handleSignedTx()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txJsonSigned])

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      setThreadTitle('')
      setPostContent('')
      setLoading(false)
      if (!account) throw new Error('No active account')
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation])

  const onPressPost = async () => {
    if (!account || !account.bech32) throw new Error('No active account: ' + JSON.stringify(account))
    await dispatch(postTxAndRedirectToSign({ callerAddressBech32: account.bech32, threadTitle, postContent })).unwrap()
  }

  const onCreate = async (form: CreateThreadFormData) => {
    if (!board) throw new Error('No active board')
    dispatch(threadCreate({ ...form, boardId: board.id.toString() }))
  }

  return <ThreadsCreateTemplate onCreate={onCreate} breadcrumbItems={BREADCRUMBS} onBackPress={() => router.back()} />
}
