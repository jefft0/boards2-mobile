import Layout from '@gno/components/layout'
import ModalHeader from '@gno/components/layout/modal-header'
import Text from '@gno/components/text'
import { User } from '@gno/types'
import { selectAccount, useAppSelector } from '@gno/redux'
import { Spacer, Button } from '@berty/gnonative-ui'

interface Props {
  onConfirm: (account: User) => void
}

function RemoveAccountContent({ onConfirm }: Props) {
  const account = useAppSelector(selectAccount)

  if (!account) {
    return null
  }

  return (
    <Layout.Container>
      <ModalHeader>
        <Text.Title>Remove Account</Text.Title>
      </ModalHeader>
      <Layout.Body>
        <Text.Body>Do you want to remove the account {account.name} from your list?</Text.Body>
        <Spacer space={32} />
        <Button onPress={() => onConfirm(account)} color="danger">
          {`Remove ${account.name}`}
        </Button>
      </Layout.Body>
    </Layout.Container>
  )
}

export default RemoveAccountContent
