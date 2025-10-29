import { StyleSheet, View } from 'react-native'
import Text from '@gno/components/text'
import { colors } from '@gno/styles/colors'
import { Post, User } from '@gno/types'
import FeedView from '../feed/feed-view'
import Avatar from '@gno/components/avatar/avatar'

interface Props {
  onPressPost: (post: Post) => void
  onGnod: (post: Post) => void
  user: User
  currentUser: User
  totalPosts: number
  callerAddress: Uint8Array
}

function AccountView(props: Props) {
  const { onPressPost, onGnod, user, totalPosts } = props
  const accountName = user.name

  // const isFollowed = useMemo(
  //   () => followers.find((f) => f.address.toString() === currentUser.bech32) != null,
  //   [followers, currentUser]
  // )

  const avarUri = user.avatar ? user.avatar : 'https://www.gravatar.com/avatar/tmp'

  return (
    <>
      <View style={styles.container}>
        <View style={styles.banner}>
          <Avatar uri={avarUri} style={styles.avatar} />
        </View>
        <View style={{ width: '100%', marginHorizontal: 16, gap: 8 }}>
          <Text.Title>{accountName}</Text.Title>
        </View>
        <View style={{ flex: 1, width: '100%', paddingHorizontal: 16, paddingTop: 8 }}>
          <Text.Body>Posts</Text.Body>
          <View style={{ height: 1, backgroundColor: colors.grayscale[200] }} />
          <FeedView totalPosts={totalPosts} onPress={onPressPost} onGnod={onGnod} bech32={user.bech32} type="userPosts" />
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginLeft: 16
  },
  container: {
    height: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: colors.grayscale[100]
  },
  banner: { width: '100%', height: 100, backgroundColor: colors.grayscale[200] }
})

export default AccountView
