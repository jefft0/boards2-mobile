import { TouchableOpacity, TouchableOpacityProps } from 'react-native'
import CardFooter from './CardFooter'

type Props = {
  label: string
  children: React.ReactNode
  onPress: () => void
  hideLabel?: boolean
  count?: number
} & TouchableOpacityProps

const CardFooterButton = ({ children, label, hideLabel, count, ...rest }: Props) => {
  return (
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} {...rest}>
      {children}
      <CardFooter.MetaValue>{hideLabel ? ` ${count}` : ` ${count} ${label}`}</CardFooter.MetaValue>
    </TouchableOpacity>
  )
}

export default CardFooterButton
