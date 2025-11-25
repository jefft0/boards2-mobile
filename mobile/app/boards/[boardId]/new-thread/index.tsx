import { useNavigation, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  broadcastTxCommit,
  clearLinking,
  selectAccount,
  selectQueryParamsTxJsonSigned,
  selectThreadBoard,
  threadCreate,
  useAppDispatch,
  useAppSelector
} from '@gno/redux'
import { BREADCRUMBS } from '@gno/constants/Constants'
import { ThreadsCreateTemplate } from '@gno/components/templates/ThreadsCreateTemplate'
import { CreateThreadFormData } from '@gno/components/threads/CreateThreadForm'

export default function Search() {
  const [loading, setLoading] = useState(false)
  const navigation = useNavigation()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const account = useAppSelector(selectAccount)
  const board = useAppSelector(selectThreadBoard)

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
          router.back()
        } catch (error) {
          console.error('on broadcastTxCommit', error)
        }
      }
    }
    handleSignedTx()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txJsonSigned])

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      setLoading(false)
      if (!account) throw new Error('No active account')
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation])

  const onCreate = async (form: CreateThreadFormData) => {
    if (!board) throw new Error('No active board')
    setLoading(true)
    dispatch(threadCreate({ ...form, boardId: board.id.toString() }))
  }

  return (
    <ThreadsCreateTemplate
      loading={loading}
      onCreate={onCreate}
      breadcrumbItems={BREADCRUMBS}
      onBackPress={() => router.back()}
    />
  )
}
