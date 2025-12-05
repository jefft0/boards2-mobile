import { TouchableOpacity, TouchableOpacityProps } from 'react-native'
import CardFooter from './CardFooter'
import { LoadingSkeleton } from '../skeleton'

export type CardFooterButtonProps = {
  label: string
  children: React.ReactNode
  onPress: () => void
  hideLabel?: boolean
  count?: number
  loading?: boolean
} & TouchableOpacityProps

const CardFooterButton = ({ children, label, hideLabel, count, loading, ...rest }: CardFooterButtonProps) => {
  const displayLabel = hideLabel ? ` ${count}` : ` ${count} ${label}`
  if (loading) {
    return <LoadingSkeleton />
  }
  return (
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} {...rest}>
      {children}
      <CardFooter.MetaValue>{displayLabel}</CardFooter.MetaValue>
    </TouchableOpacity>
  )
}

export default CardFooterButton
