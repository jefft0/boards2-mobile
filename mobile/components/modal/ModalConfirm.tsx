import { Modal as NativeModal } from 'react-native'
import ModalHeader from './ModalHeader'
import ModalContent from './ModalContent'
import { Button, Spacer, Text } from '@berty/gnonative-ui'

export type Props = {
  title: string
  message: string
  visible: boolean
  onClose: () => void
  onConfirm: () => void
}

const ModalConfirm = ({ visible, onClose, onConfirm, title, message }: Props) => {
  return (
    <NativeModal visible={visible} transparent={true} animationType="slide">
      <ModalContent>
        <ModalHeader title={title} onClose={onClose} />
        <Text.Body>{message}</Text.Body>
        <Spacer />
        <Button onPress={onConfirm} color="danger">
          Confirm
        </Button>
        <Spacer />
        <Button onPress={onClose} color="secondary">
          Close
        </Button>
      </ModalContent>
    </NativeModal>
  )
}

export default ModalConfirm
