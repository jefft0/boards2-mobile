import { useTheme } from 'styled-components/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import CardFooterButton, { CardFooterButtonProps } from '../cards/CardFooterButton'

type Props = Omit<CardFooterButtonProps, 'label' | 'children'>

const ReplyIconButton = ({ count, ...rest }: Props) => {
  const theme = useTheme()
  return (
    <CardFooterButton {...rest} label="Replies" count={count}>
      <Ionicons
        name={count && count > 0 ? 'chatbox-ellipses-sharp' : 'chatbox-ellipses-outline'}
        size={16}
        color={theme.colors.gray}
      />
    </CardFooterButton>
  )
}

export default ReplyIconButton
