import { View, StyleSheet } from 'react-native'
import { Text } from '@berty/gnonative-ui'
import { Breadcrumb } from '../list/Breadcrumb'
import BackButton from '../button/BackButton'

interface Props {
  breadcrumbItems: string[]
  onBackPress?: () => void
  title: string
}

export const BoardsCreateHeader = ({ breadcrumbItems, onBackPress, title = 'Boards' }: Props) => {
  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <BackButton onPress={onBackPress} />
        <View style={styles.title}>
          <Text.Title2>{title}</Text.Title2>
        </View>
      </View>
      <View style={styles.dividerGrey}>
        <Breadcrumb items={breadcrumbItems} />
      </View>
      <View style={styles.actions}>
        {/* <ActionButton label="Create Board" onPress={onCreateBoard} icon="Add" disabled={!canCreate} /> */}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  divider: {
    marginHorizontal: 8
  },
  dividerGrey: {
    marginTop: 16
  }
})
