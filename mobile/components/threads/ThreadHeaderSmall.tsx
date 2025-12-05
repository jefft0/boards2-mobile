import { View, StyleSheet } from 'react-native'
import { Breadcrumb } from '../list/Breadcrumb'
import BackButton from '../button/BackButton'

interface ThreadHeaderProps {
  breadcrumbItems: string[]
  title?: string
  creatorName: string
  createdDate?: string
  onBackPress: () => void
  loading?: boolean
}

export const ThreadHeaderSmall = ({
  breadcrumbItems,
  title,
  creatorName,
  createdDate,
  onBackPress,
  loading
}: ThreadHeaderProps) => {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <BackButton onPress={onBackPress} />
        <Breadcrumb size="small" items={breadcrumbItems} />
        {/* <Text.Title3 style={styles.title}>{loading ? 'Loading...' : title}</Text.Title3> */}
      </View>
      {/* <View style={styles.row}>
        <CreatedBy creatorName={creatorName} createdAt={createdDate} loading={loading} />
      </View> */}
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
  divider: {
    marginHorizontal: 8
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', alignContent: 'center' }
})
