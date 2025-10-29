import { Stack } from 'expo-router'

export default function DynamicLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: false,
        headerShown: false
      }}
    >
      <Stack.Screen name="index" />

      <Stack.Screen
        name="remove"
        options={{
          presentation: 'modal'
        }}
      />
    </Stack>
  )
}
