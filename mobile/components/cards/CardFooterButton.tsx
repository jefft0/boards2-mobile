import { TouchableOpacity, TouchableOpacityProps } from 'react-native'
import CardFooter from './CardFooter'
import styled from 'styled-components/native'

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
    return <LoadingView />
  }
  return (
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} {...rest}>
      {children}
      <CardFooter.MetaValue>{displayLabel}</CardFooter.MetaValue>
    </TouchableOpacity>
  )
}

const LoadingView = styled.View`
  width: 50px;
  height: 16px;
  background-color: #e5e7eb;
  border-radius: 4px;
`

export default CardFooterButton
