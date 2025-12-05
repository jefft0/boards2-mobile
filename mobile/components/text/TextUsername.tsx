import { Text } from '@berty/gnonative-ui'
import { useTheme } from 'styled-components/native'

const TextUsername = ({ value }: { value?: string }) => {
  const theme = useTheme()
  return <Text.Caption color={theme.colors.primary}>{value ? `@${value}` : ''}</Text.Caption>
}

export default TextUsername
