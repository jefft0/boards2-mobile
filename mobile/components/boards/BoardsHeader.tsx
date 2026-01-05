import { View, StyleSheet } from 'react-native'
import { Text } from '@berty/gnonative-ui'
import { ActionButton } from '../button/ActionButton'
import { Breadcrumb } from '../list/Breadcrumb'

interface BoardsHeaderProps {
  breadcrumbItems: string[]
  onCreateBoard: () => void
  canCreate?: boolean
  onListAdminUsers: () => void
  onHelp: () => void
  title?: string
}

export const BoardsHeader = ({ 
  breadcrumbItems,
  onCreateBoard,
  canCreate,
  onListAdminUsers,
  onHelp,
  title
}: BoardsHeaderProps) => {
  return (
    <View style={styles.header}>
      <Breadcrumb items={breadcrumbItems} />
      <Text.LargeTitle style={styles.title}>{title || 'Boards'}</Text.LargeTitle>
      <View style={styles.actions}>
        <ActionButton label="Create Board" onPress={onCreateBoard} icon="Add" disabled={!canCreate} />
        {/* TODO: Implement dynamic action renderer */}
        {/* <Text.Body color="#ccc" style={styles.divider}>
          •
        </Text.Body>
        <ActionButton label="List Admin Users" onPress={onListAdminUsers} />
        <Text.Body color="#ccc" style={styles.divider}>
          •
        </Text.Body>
        <ActionButton label="Help" onPress={onHelp} /> */}
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
  title: {
    marginVertical: 8
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  divider: {
    marginHorizontal: 8
  }
})
