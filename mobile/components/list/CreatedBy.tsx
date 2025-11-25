import { Text } from '@berty/gnonative-ui'
import { View } from 'react-native'
import { useTheme } from 'styled-components/native'

interface Props {
  creatorName: string
  createdAt?: string
  boardId?: string
}

export const CreatedBy = (props: Props) => {
  const theme = useTheme()
  return (
    <View>
      <Text.Caption>
        Created by <Text.Caption color={theme.colors.primary}>@{props.creatorName}</Text.Caption>
      </Text.Caption>
      {props.createdAt && (
        <Text.Caption>
          on {props.createdAt}, #{props.boardId}
        </Text.Caption>
      )}
    </View>
  )
}
