import { Text } from '@berty/gnonative-ui'
import React from 'react'
import { View } from 'react-native'

export const ListEmptyComponent = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text.Body style={{ fontSize: 16, color: '#6b7280', textAlign: 'center' }}>No threads yet.</Text.Body>
    </View>
  )
}
