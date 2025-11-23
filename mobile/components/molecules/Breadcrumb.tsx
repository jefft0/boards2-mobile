import { View, StyleSheet } from 'react-native'
import { Text } from '@berty/gnonative-ui'
import { useTheme } from 'styled-components/native'

interface BreadcrumbProps {
  items: string[]
}

export const Breadcrumb = ({ items }: BreadcrumbProps) => {
  const theme = useTheme()
  return (
    <View style={styles.breadcrumb}>
      {items.map((item, index) => (
        <View key={index} style={styles.breadcrumbItem}>
          <Text.Body color={theme.colors.primary}>{item}</Text.Body>
          {index < items.length - 1 && (
            <Text.Body color={theme.colors.gray} style={styles.separator}>
              {' / '}
            </Text.Body>
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
    marginHorizontal: 4
  }
})
