import { useLocalSearchParams, usePathname, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  broadcastTxCommit,
  clearLinking,
  selectSignedTx,
  selectThreadBoard,
  threadReplyAndRedirectToSign,
  useAppDispatch,
  useAppSelector
} from '@gno/redux'
import { BREADCRUMBS } from '@gno/constants/Constants'
import { ThreadsReplyTemplate } from '@gno/components/templates/ThreadsReplyTemplate'
import ReplyThreadForm, { CreateReplyThreadFormData } from '@gno/components/threads/ReplyThreadForm'
import { useWalletFailure } from '@gno/hooks/use-wallet-failure'

export default function Page() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const board = useAppSelector(selectThreadBoard)
  const signedTxFromWallet = useAppSelector(selectSignedTx)
  const { threadId } = useLocalSearchParams()
  const currentPath = usePathname()

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
          // typed for a reply that was never created. `.unwrap()` is what makes the
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

  const onCreate = async (form: CreateReplyThreadFormData) => {
    if (!board) throw new Error('No active board')
    setLoading(true)
    dispatch(threadReplyAndRedirectToSign({ callbackPath: currentPath, replyBody: form.replyBody }))
  }

  return (
    <ThreadsReplyTemplate
      breadcrumbItems={[...BREADCRUMBS, `${board?.name.toString()}`, `${threadId.toString()}`]}
      onBackPress={() => router.back()}
      title="Reply"
    >
      <ReplyThreadForm onCancel={() => router.back()} onCreate={onCreate} loading={loading} />
    </ThreadsReplyTemplate>
  )
}
