import Icons from '@gno/components/icons'
import { Tabs } from 'expo-router'
import { useTheme } from 'styled-components/native'

export default function AppLayout() {
  const theme = useTheme()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray
      }}
    >
      <Tabs.Screen
        name="boards"
        options={{
          title: 'Boards',
          tabBarIcon: ({ focused }) => <Icons.Home color={focused ? theme.colors.primary : theme.colors.gray} />
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <Icons.Search color={focused ? theme.colors.primary : theme.colors.gray} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <Icons.Profile color={focused ? theme.colors.primary : theme.colors.gray} />
        }}
      />
    </Tabs>
  )
}
