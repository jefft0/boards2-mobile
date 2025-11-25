import { TouchableOpacity, TouchableOpacityProps } from 'react-native'
import Icons from '../icons'

const BackButton = (props: TouchableOpacityProps) => {
  return (
    <TouchableOpacity {...props}>
      <Icons.ArrowLeft />
    </TouchableOpacity>
  )
}

export default BackButton
