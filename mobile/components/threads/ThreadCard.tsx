import { Post } from '@gno/types'
import { useTheme } from 'styled-components/native'
import CardFooter from '../cards/CardFooter'
import GnodLikeButton from '../button/GnodLikeButton'
import { useState } from 'react'
import ReplyIconButton from '../button/ReplyIconButton'
import { ThreadContainer, ThreadTitle, ThreadContent, RepostNote } from './cards/atoms'
import { Spacer } from '@berty/gnonative-ui'

interface Props {
  thread: Post
  onReply: () => void
  onOpen?: () => void
}

const ThreadCard = ({ thread, onReply, onOpen }: Props) => {
  const theme = useTheme()
  const [likes, setLikes] = useState(0)
  const [isLiked, setIsLiked] = useState(false)

  const handleLike = (liked: boolean) => {
    setIsLiked(liked)
    setLikes((prev) => (liked ? prev + 1 : prev - 1))
  }

  // A repost has no summary of its own, so show the one of the thread it reposts.
  const summary = thread.repost_parent ?? thread
  const stacked = summary.user.name.length > 20

  return (
    <ThreadContainer key={thread.id} activeOpacity={0.7} onPress={onOpen}>
      {thread.repost_parent && <RepostNote>⟳ Reposted by @{thread.user.name}</RepostNote>}
      <ThreadTitle>{summary.title}</ThreadTitle>
      <Spacer space={8} />

      <ThreadContent>{summary.body}</ThreadContent>

      <CardFooter.Footer style={stacked ? { flexDirection: 'column', alignItems: 'flex-start' } : undefined}>
        <CardFooter.MetaItem style={stacked ? undefined : { minWidth: 120 }}>
          <CardFooter.MetaValue color={theme.colors.primary}>@{summary.user.name}</CardFooter.MetaValue>
        </CardFooter.MetaItem>
        {stacked && <Spacer space={8} />}
        <CardFooter.Meta style={stacked ? { marginLeft: 136 } : undefined}>
          <CardFooter.MetaItem>
            <ReplyIconButton onPress={onReply} count={thread.n_replies} />
          </CardFooter.MetaItem>
          <CardFooter.MetaItem>
            <GnodLikeButton
              isLiked={isLiked}
              onPress={handleLike}
              size={16}
              likedColor={theme.colors.primary}
              unlikedColor="#9ca3af"
              gnodCount={likes}
            />
          </CardFooter.MetaItem>
        </CardFooter.Meta>
      </CardFooter.Footer>
    </ThreadContainer>
  )
}

export default ThreadCard
