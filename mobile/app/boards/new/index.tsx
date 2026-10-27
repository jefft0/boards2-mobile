import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  BoardCreationData,
  broadcastTxCommit,
  clearLinking,
  createBoard,
  selectSignedTx,
  useAppDispatch,
  useAppSelector
} from '@gno/redux'
import { BoardsCreateTemplate } from '@gno/components/templates/BoardsCreateTemplate'
import { BREADCRUMBS } from '@gno/constants/Constants'

export default function Search() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const signedTxFromWallet = useAppSelector(selectSignedTx)

  // hook to handle the signed tx from Gnokey and broadcast it
  useEffect(() => {
    const handleSignedTx = async () => {
      if (signedTxFromWallet) {
        const signedTx = signedTxFromWallet as string // opaque base64 amino-binary; broadcast unmodified

        try {
          setLoading(true)
          await dispatch(clearLinking())
          await dispatch(broadcastTxCommit(signedTx)).unwrap()
          router.back()
        } catch (error) {
          // Stay put with the form still filled: going back would lose what was
          // typed for a board that was never created. `.unwrap()` is what makes the
          // rejection reach here — a plain dispatch resolves either way.
          console.error('on broadcastTxCommit', error)
          setLoading(false)
        }
      }
    }
    handleSignedTx()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedTxFromWallet])

  const onCreate = async (board: BoardCreationData) => {
    dispatch(createBoard(board))
  }

  return (
    <BoardsCreateTemplate loading={loading} onCreate={onCreate} breadcrumbItems={BREADCRUMBS} onBackPress={() => router.back()} />
  )
}
