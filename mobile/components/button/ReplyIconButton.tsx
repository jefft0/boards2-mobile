import { TouchableOpacity } from 'react-native'
import CardFooter from '../cards/CardFooter'
import { useTheme } from 'styled-components/native'
import Ionicons from '@expo/vector-icons/Ionicons'

const ReplyIconButton = ({ onPress, count }: { onPress: () => void; count: number }) => {
  const theme = useTheme()
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
      <Ionicons name={count > 0 ? 'chatbox-ellipses-sharp' : 'chatbox-ellipses-outline'} size={16} color={theme.colors.gray} />
      <CardFooter.MetaValue> {count} </CardFooter.MetaValue>
    </TouchableOpacity>
  )
}

export default ReplyIconButton
