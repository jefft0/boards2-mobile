import { View, StyleSheet } from 'react-native'
import { Text } from '@berty/gnonative-ui'
import { ActionButton } from '../button/ActionButton'
import { Breadcrumb } from '../list/Breadcrumb'
import BackButton from '../button/BackButton'
import { CreatedBy } from '../list/CreatedBy'
import { ThreadCount } from '../list/ThreadCount'

interface ThreadHeaderProps {
  breadcrumbItems: string[]
  onCreateThread: () => void
  canCreate?: boolean
  title?: string
  creatorName: string
  threadCount?: number
  onBackPress: () => void
}

export const ThreadHeader = ({
  breadcrumbItems,
  onCreateThread,
  canCreate,
  title,
  creatorName,
  threadCount,
  onBackPress
}: ThreadHeaderProps) => {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <BackButton onPress={onBackPress} />
        <Text.Title1 style={styles.title}>{title}</Text.Title1>
      </View>
      <Breadcrumb size="small" items={breadcrumbItems} />
      <View style={styles.row}>
        <CreatedBy creatorName={creatorName} />
        <Text.Body color="#ccc" style={styles.divider}>
          •
        </Text.Body>
        <ThreadCount count={threadCount || 0} />
      </View>
      <View style={styles.actions}>
        <ActionButton label="Create Thread" onPress={onCreateThread} icon="Add" disabled={!canCreate} />
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
    marginVertical: 0
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8
  },
  divider: {
    marginHorizontal: 8
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', alignContent: 'center' }
})
