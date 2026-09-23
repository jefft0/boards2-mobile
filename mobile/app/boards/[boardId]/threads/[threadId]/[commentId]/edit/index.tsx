import { useLocalSearchParams, usePathname, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  broadcastTxCommit,
  clearLinking,
  editReplyAndRedirectToSign,
  selectReplyToEdit,
  selectSignedTx,
  selectThreadBoard,
  useAppDispatch,
  useAppSelector
} from '@gno/redux'
import { BREADCRUMBS } from '@gno/constants/Constants'
import { ThreadsReplyTemplate } from '@gno/components/templates/ThreadsReplyTemplate'
import ReplyThreadForm, { CreateReplyThreadFormData } from '@gno/components/threads/ReplyThreadForm'
import { useWalletFailure } from '@gno/hooks/use-wallet-failure'

// Edit a comment or reply. This matches the gnoweb render route
// "{board}/{thread}/{reply}/edit".
export default function Page() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const board = useAppSelector(selectThreadBoard)
  const replyToEdit = useAppSelector(selectReplyToEdit)
  const signedTxFromWallet = useAppSelector(selectSignedTx)
  const { boardId, threadId, commentId } = useLocalSearchParams<{
    boardId: string
    threadId: string
    commentId: string
  }>()
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
          // Stay put with the form still filled: going back would lose the edit
          // for a reply that was never changed. `.unwrap()` is what makes the
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
    dispatch(
      editReplyAndRedirectToSign({
        boardId: Number(boardId),
        threadId: Number(threadId),
        replyId: Number(commentId),
        replyBody: form.replyBody,
        callbackPath: currentPath
      })
    )
  }

  // The body comes from the card that offered Edit. A stale one from an earlier
  // edit would silently overwrite this reply with another's text, so only use it
  // when it is the reply which the route names.
  const initialBody = replyToEdit?.id === Number(commentId) ? replyToEdit.body : ''

  return (
    <ThreadsReplyTemplate
      breadcrumbItems={[...BREADCRUMBS, `${board?.name.toString()}`, threadId, commentId]}
      onBackPress={() => router.back()}
      title="Edit"
    >
      <ReplyThreadForm
        onCancel={() => router.back()}
        onCreate={onCreate}
        loading={loading}
        isComment
        initialBody={initialBody}
        submitLabel="Save"
        helperText="Edit your reply"
      />
    </ThreadsReplyTemplate>
  )
}
