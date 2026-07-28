import Close from './Close'
import ArrowLeft from './ArrowLeft'
import Exclamation from './Exclamation'
import CheckMark from './CheckMark'
import Home from './Home'
import Profile from './Profile'
import Gnod from './Gnod'
import Gnoded from './Gnoded'
import Ionicons from '@expo/vector-icons/Ionicons'

export interface IconProps {
  color?: string
  size?: number
  width?: number
  height?: number
}

export type IconComponent = React.ComponentType<IconProps>

const Icons = {
  ArrowLeft,
  Close,
  CheckMark,
  Add: ((props: IconProps) => <Ionicons name="add-circle-outline" size={props.size} color={props.color} />) as IconComponent,
  Network: ((props: IconProps) => (
    <Ionicons name="globe-outline" size={props.size ?? 24} color={props.color ?? '#667386'} />
  )) as IconComponent,
  Exclamation,
  Home,
  Profile,
  Gnod,
  Gnoded
}

export default Icons
