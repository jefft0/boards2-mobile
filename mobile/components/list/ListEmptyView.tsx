import { Text } from '@berty/gnonative-ui'
import React from 'react'
import { View } from 'react-native'
import { useTheme } from 'styled-components/native'

export const ListEmptyView = ({ message }: { message: string }) => {
  const theme = useTheme()
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 120 }}>
      <Text.Title3 style={{ color: theme.text.textMuted }}>{message}</Text.Title3>
    </View>
  )
}
