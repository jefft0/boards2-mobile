import { View, StyleSheet } from 'react-native'
import { Text } from '@berty/gnonative-ui'
import { useTheme } from 'styled-components/native'

interface BreadcrumbProps {
  items: string[]
  size?: 'default' | 'small'
}

export const Breadcrumb = ({ items, size = 'default' }: BreadcrumbProps) => {
  const theme = useTheme()
  const TextComponent = size === 'small' ? Text.Footnote : Text.Body

  return (
    <View style={styles.breadcrumb}>
      {items.map((item, index) => (
        <View key={index} style={styles.breadcrumbItem}>
          <TextComponent color={index === items.length - 1 ? theme.colors.primary : theme.text.textMuted}>{item}</TextComponent>
          {index < items.length - 1 && (
            <TextComponent color={theme.text.textMuted} style={styles.separator}>
              {' / '}
            </TextComponent>
          )}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  breadcrumb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 8
  },
  breadcrumbItem: {
    flexDirection: 'row'
  },
  separator: {
    marginHorizontal: 2
  }
})
