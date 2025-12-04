import { View } from 'react-native'
import { Text } from '@berty/gnonative-ui'
import { formatTimestamp } from '@gno/utils/format-utils'
import { useTheme } from 'styled-components/native'

interface Props {
  creatorName: string
  createdAt?: string
  boardId?: string
  loading?: boolean
}

export const CreatedBy = (props: Props) => {
  const theme = useTheme()
  const parts = []
  if (props.createdAt) {
    parts.push(` on ${formatTimestamp(props.createdAt)}`)
  }
  if (props.boardId) {
    parts.push(` #${props.boardId}`)
  }

  return (
    <View>
      <Text.Caption>
        {props.loading ? (
          ''
        ) : (
          <Text.Caption color={theme.colors.primary}>
            @{props.creatorName}
            <Text.Caption>{parts.length > 0 && parts.join(', ')}</Text.Caption>
          </Text.Caption>
        )}
      </Text.Caption>
    </View>
  )
}
