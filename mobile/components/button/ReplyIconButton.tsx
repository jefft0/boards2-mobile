import { useTheme } from 'styled-components/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import CardFooterButton from '../cards/CardFooterButton'

interface Props {
  onPress: () => void
  count: number
  showLabel?: boolean
}

const ReplyIconButton = ({ onPress, count, showLabel }: Props) => {
  const theme = useTheme()
  return (
    <CardFooterButton onPress={onPress} label="Replies" count={count}>
      <Ionicons name={count > 0 ? 'chatbox-ellipses-sharp' : 'chatbox-ellipses-outline'} size={16} color={theme.colors.gray} />
    </CardFooterButton>
  )
}

export default ReplyIconButton
