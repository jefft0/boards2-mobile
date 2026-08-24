import { Text } from '@berty/gnonative-ui'
import { formatTimestamp } from '@gno/utils/format-utils'
import { useTheme } from 'styled-components/native'

const TextCreateDate = ({ value, postId }: { value?: string; postId?: number }) => {
  const theme = useTheme()
  const date = value ? formatTimestamp(value) : ''
  const id = postId === undefined ? '' : `#${postId}`
  return <Text.Caption1 color={theme.text.textMuted}>{[date, id].filter(Boolean).join(', ')}</Text.Caption1>
}

export default TextCreateDate
