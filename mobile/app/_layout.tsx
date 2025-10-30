import { Stack } from 'expo-router'

import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Guard } from '@gno/components/auth/guard'
import { GnoNativeProvider } from '@gnolang/gnonative'
import { ReduxProvider } from 'redux/redux-provider'
import { LinkingProvider } from '@gno/provider/linking-provider'

const gnoDefaultConfig = {
  // @ts-ignore
  remote: '', // It will be set dynamically from linking state
  // @ts-ignore
  chain_id: '' // It will be set dynamically from linking state
}

export default function AppLayout() {
  return (
    <GnoNativeProvider config={gnoDefaultConfig}>
      <ReduxProvider>
        <LinkingProvider>
          <ThemeProvider value={DefaultTheme}>
            <Guard>
              <Stack
                screenOptions={{
                  headerShown: false,
                  headerLargeTitle: true,
                  headerBackVisible: false
                }}
              />
            </Guard>
          </ThemeProvider>
        </LinkingProvider>
      </ReduxProvider>
    </GnoNativeProvider>
  )
}
