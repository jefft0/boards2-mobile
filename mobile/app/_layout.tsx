import { Stack } from 'expo-router'

import { Guard } from '@gno/components/auth/guard'
import { GnoNativeProvider } from '@gnolang/gnonative'
import { ReduxProvider } from '@gno/redux'
import { LinkingProvider } from '@gno/provider/linking-provider'
import { ThemeProvider, DefaultTheme } from '@berty/gnonative-ui'

const gnoDefaultConfig = {
  // @ts-ignore
  remote: '', // It will be set dynamically from linking state
  // @ts-ignore
  chain_id: '' // It will be set dynamically from linking state
}

const theme: DefaultTheme = {
  borderRadius: 8,

  fonts: {
    family: {
      regular: 'System', // or your custom font
      medium: 'System-Medium',
      semibold: 'System-Semibold',
      bold: 'System-Bold'
    },
    size: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      xxl: 24
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8
    }
  },

  error: { background: '#FFE5E6', text: '#FA262A' },
  success: { background: '#E5F9E5', text: '#00A86B' },

  colors: {
    primary: '#266000',
    black: '#000000',
    white: '#ffffff',
    gray: '#A1A1A1',
    background: '#FDFDFD',
    backgroundSecondary: '#f8f8f8',
    border: '#D1D1D6', // Border, Ruller, Divider
    link: '#007AFF'
  },

  text: {
    textMuted: '#6b7280'
  },

  components: {
    input: {
      label: '#374151'
    }
  },

  textinputs: {
    primary: {
      placeholder: {
        color: '#8D8D8D'
      }
    },
    secondary: {
      background: '#ffffff'
    },
    border: '#94A0AB',
    label: '#000000',
    background: '#EBEBEB',
    disabled: { background: '#EBEBEB' }
  },

  buttons: {
    primary: {
      background: '#C8DBA8',
      border: '#2E5034',
      label: '#2E5034'
    },
    secondary: {
      background: '#FFFFFF',
      border: '#d1d5db',
      label: '#374151'
    },
    tertirary: {
      background: '#15803d',
      border: '#15803d',
      label: '#FFFFFF'
    },
    danger: '#FF4647',
    dangersecondary: '#E5E5E5',

    label: {
      primary: '#FFFFFF',
      secondary: '#007AFF',
      tertirary: '#000000',
      danger: '#ffffff',
      dangersecondary: '#FF4647'
    }
  }
}

export default function AppLayout() {
  return (
    <GnoNativeProvider config={gnoDefaultConfig}>
      <ReduxProvider>
        <LinkingProvider>
          <ThemeProvider theme={theme}>
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
