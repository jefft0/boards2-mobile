import { Post } from '@gno/types'
import { useTheme } from 'styled-components/native'
import CardFooter from '../cards/CardFooter'
import GnodLikeButton from '../button/GnodLikeButton'
import { useState } from 'react'
import ReplyIconButton from '../button/ReplyIconButton'
import { ThreadContainer, ThreadTitle, ThreadContent, QuotedThread, RepostNote } from './cards/atoms'
import { Spacer } from '@berty/gnonative-ui'

interface Props {
  thread: Post
  onReply: () => void
  onOpen?: () => void
  onOpenOriginal?: () => void
}

const ThreadCard = ({ thread, onReply, onOpen, onOpenOriginal }: Props) => {
  const theme = useTheme()
  const [likes, setLikes] = useState(0)
  const [isLiked, setIsLiked] = useState(false)

  const handleLike = (liked: boolean) => {
    setIsLiked(liked)
    setLikes((prev) => (liked ? prev + 1 : prev - 1))
  }

  const isRepost = thread.originalBoardId !== 0
  const original = thread.repost_parent
  const stacked = thread.user.name.length > 20

  return (
    <ThreadContainer key={thread.id} activeOpacity={0.7} onPress={onOpen}>
      {/* A repost's own title and body are optional. */}
      {thread.title ? (
        <>
          <ThreadTitle>{thread.title}</ThreadTitle>
          <Spacer space={8} />
        </>
      ) : null}

      {thread.body ? <ThreadContent>{thread.body}</ThreadContent> : null}

      {isRepost && (
        <QuotedThread activeOpacity={0.7} onPress={onOpenOriginal} disabled={!original}>
          {original ? (
            <>
              <RepostNote>⟳ Reposted from @{original.user.name}</RepostNote>
              <ThreadTitle>{original.title}</ThreadTitle>
              <Spacer space={8} />

              <ThreadContent>{original.body}</ThreadContent>
            </>
          ) : (
            <RepostNote>⚠ The reposted thread is no longer available</RepostNote>
          )}
        </QuotedThread>
      )}

      <CardFooter.Footer style={stacked ? { flexDirection: 'column', alignItems: 'flex-start' } : undefined}>
        <CardFooter.MetaItem style={stacked ? undefined : { minWidth: 120 }}>
          <CardFooter.MetaValue color={theme.colors.primary}>@{thread.user.name}</CardFooter.MetaValue>
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
