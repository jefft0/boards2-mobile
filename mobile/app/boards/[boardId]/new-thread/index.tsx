import { useNavigation, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  broadcastTxCommit,
  clearLinking,
  selectAccount,
  selectSignedTx,
  selectThreadBoard,
  threadCreate,
  useAppDispatch,
  useAppSelector
} from '@gno/redux'
import { BREADCRUMBS } from '@gno/constants/Constants'
import { ThreadsCreateTemplate } from '@gno/components/templates/ThreadsCreateTemplate'
import { useWalletFailure } from '@gno/hooks/use-wallet-failure'
import { CreateThreadFormData } from '@gno/components/threads/CreateThreadForm'

export default function Search() {
  const [loading, setLoading] = useState(false)
  const navigation = useNavigation()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const account = useAppSelector(selectAccount)
  const board = useAppSelector(selectThreadBoard)

  const signedTxFromWallet = useAppSelector(selectSignedTx)

  // hook to handle the signed tx from the Gnokey and broadcast it
  useEffect(() => {
    const handleSignedTx = async () => {
      if (signedTxFromWallet) {
        const signedTx = signedTxFromWallet as string // opaque base64 amino-binary; broadcast unmodified
        console.log('signedTx: ', signedTx)

        try {
          setLoading(true)
          await dispatch(clearLinking())
          await dispatch(broadcastTxCommit(signedTx)).unwrap()
          router.back()
        } catch (error) {
          // Stay put with the form still filled: going back would lose what was
          // typed for a thread that was never created. `.unwrap()` is what makes the
          // rejection reach here — a plain dispatch resolves either way.
          console.error('on broadcastTxCommit', error)
          setLoading(false)
        }
      }
    }
    handleSignedTx()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedTxFromWallet])

  // The wallet declined or failed: stop waiting. The snackbar says why.
  useWalletFailure(() => setLoading(false))

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
      breadcrumbItems={[...BREADCRUMBS, board?.name || 'unknown']}
      onBackPress={() => router.back()}
    />
  )
}
