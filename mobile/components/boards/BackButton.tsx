import { TouchableOpacity } from 'react-native'
import Icons from '../icons'

const BackButton = ({ onBackPress }: { onBackPress?: () => void }) => {
  return (
    <TouchableOpacity onPress={onBackPress}>
      <Icons.ArrowLeft />
    </TouchableOpacity>
  )
}

export default BackButton
