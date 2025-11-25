import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  BoardCreationData,
  broadcastTxCommit,
  clearLinking,
  createBoard,
  selectQueryParamsTxJsonSigned,
  useAppDispatch,
  useAppSelector
} from '@gno/redux'
import { BoardsCreateTemplate } from '@gno/components/templates/BoardsCreateTemplate'
import { BREADCRUMBS } from '@gno/constants/Constants'

export default function Search() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const txJsonSigned = useAppSelector(selectQueryParamsTxJsonSigned)

  // hook to handle the signed tx from Gnokey and broadcast it
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
          // setError('' + error)
        }
      }
    }
    handleSignedTx()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txJsonSigned])

  const onCreate = async (board: BoardCreationData) => {
    dispatch(createBoard(board))
  }

  return (
    <BoardsCreateTemplate loading={loading} onCreate={onCreate} breadcrumbItems={BREADCRUMBS} onBackPress={() => router.back()} />
  )
}
