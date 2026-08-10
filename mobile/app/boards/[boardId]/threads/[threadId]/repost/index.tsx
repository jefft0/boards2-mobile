import { useLocalSearchParams, usePathname, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  broadcastTxCommit,
  clearLinking,
  selectSignedTx,
  selectThreadBoard,
  selectThreadToRepost,
  threadRepostAndRedirectToSign,
  useAppDispatch,
  useAppSelector
} from '@gno/redux'
import { BREADCRUMBS } from '@gno/constants/Constants'
import { ThreadsReplyTemplate } from '@gno/components/templates/ThreadsReplyTemplate'
import RepostThreadForm, { CreateRepostThreadFormData } from '@gno/components/threads/RepostThreadForm'
import { useWalletFailure } from '@gno/hooks/use-wallet-failure'

export default function Page() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const board = useAppSelector(selectThreadBoard)
  const threadToRepost = useAppSelector(selectThreadToRepost)
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
          // typed for a repost that was never created. `.unwrap()` is what makes the
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

  const onCreate = async (form: CreateRepostThreadFormData) => {
    if (!board) throw new Error('No active board')
    setLoading(true)
    dispatch(
      threadRepostAndRedirectToSign({ callbackPath: currentPath, repostTitle: form.repostTitle, repostBody: form.repostBody })
    )
  }

  return (
    <ThreadsReplyTemplate
      breadcrumbItems={[...BREADCRUMBS, `${board?.name.toString()}`, `${threadId.toString()}`]}
      onBackPress={() => router.back()}
      title="Repost"
    >
      <RepostThreadForm
        onCancel={() => router.back()}
        onCreate={onCreate}
        loading={loading}
        initialTitle={threadToRepost?.title}
      />
    </ThreadsReplyTemplate>
  )
}
