import { Text } from '@berty/gnonative-ui'
import { formatTimestamp } from '@gno/utils/format-utils'
import { useTheme } from 'styled-components/native'

const TextCreateDate = ({ value }: { value?: string }) => {
  const theme = useTheme()
  return <Text.Caption1 color={theme.text.textMuted}>{value ? `${formatTimestamp(value)}` : ''}</Text.Caption1>
}

export default TextCreateDate
