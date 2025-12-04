import { useLocalSearchParams, usePathname, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  broadcastTxCommit,
  clearLinking,
  selectQueryParamsTxJsonSigned,
  selectThreadBoard,
  threadReplyAndRedirectToSign,
  useAppDispatch,
  useAppSelector
} from '@gno/redux'
import { BREADCRUMBS } from '@gno/constants/Constants'
import { ThreadsReplyTemplate } from '@gno/components/templates/ThreadsReplyTemplate'
import ReplyThreadForm, { CreateReplyThreadFormData } from '@gno/components/threads/ReplyThreadForm'

export default function Page() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const board = useAppSelector(selectThreadBoard)
  const txJsonSigned = useAppSelector(selectQueryParamsTxJsonSigned)
  const { threadId } = useLocalSearchParams()
  const currentPath = usePathname()

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
