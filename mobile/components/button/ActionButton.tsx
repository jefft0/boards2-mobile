import { TouchableOpacity, View, StyleSheet } from 'react-native'
import Icons from '@gno/components/icons'
import { Text } from '@berty/gnonative-ui'
import { useTheme } from 'styled-components/native'

interface ActionButtonProps {
  icon?: keyof typeof Icons
  label: string
  onPress: () => void
}

export const ActionButton = ({ icon, label, onPress }: ActionButtonProps) => {
  const theme = useTheme()
  const IconComponent = icon ? Icons[icon] : null

  return (
    <TouchableOpacity onPress={onPress} style={styles.actionButton}>
      {IconComponent && (
        <View style={styles.iconContainer}>
          <IconComponent color={theme.colors.primary} size={22} />
        </View>
      )}
      <Text.Body color={theme.colors.primary}>{label}</Text.Body>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 0
  },
  iconContainer: {
    marginRight: 2
  }
})
