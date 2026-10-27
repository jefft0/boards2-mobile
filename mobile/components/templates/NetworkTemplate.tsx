import { View, StyleSheet, Platform, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@berty/gnonative-ui'
import BackButton from '../button/BackButton'
import NetworkForm from '../settings/network/NetworkForm'

interface NetworkTemplateProps {
  onBackPress: () => void
  onSwitched?: () => void
}

export const NetworkTemplate = ({ onBackPress, onSwitched }: NetworkTemplateProps) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <BackButton onPress={onBackPress} />
            <View style={styles.title}>
              <Text.Title2>Network</Text.Title2>
            </View>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <NetworkForm onSwitched={onSwitched} />
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.select({ ios: 0, android: 25 })
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb'
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  title: {
    flex: 1,
    alignItems: 'center',
    paddingRight: 16
  },
  body: {
    flexGrow: 1
  }
})
