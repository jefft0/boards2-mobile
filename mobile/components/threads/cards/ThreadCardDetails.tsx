import { ParentPost, Post } from '@gno/types'
import { useTheme } from 'styled-components/native'
import CardFooter from '../../cards/CardFooter'
import GnodLikeButton from '../../button/GnodLikeButton'
import { useState } from 'react'
import ReplyIconButton from '../../button/ReplyIconButton'
import { Spacer } from '@berty/gnonative-ui'
import { TextUsername } from '../../text'
import { ThreadContainer, ThreadContent, ThreadHeader, UserInfo, ThreadTitle } from './atoms'
import TextCreateDate from '@gno/components/text/TextCreateDate'
import RepostQuote from './RepostQuote'

interface Props {
  loading?: boolean
  thread?: Post
  threadId: string
  threadTitle: string
  threadBody?: string
  threadReplyCount?: number
  threadCreatorName?: string
  threadCreatedAt?: string
  isRepost?: boolean
  threadOriginal?: ParentPost
  onReply: () => void
  onOpen?: () => void
  onOpenOriginal?: () => void
}

const ThreadCardDetails = ({
  thread,
  threadId,
  threadTitle,
  threadBody,
  threadReplyCount,
  threadCreatorName,
  threadCreatedAt,
  isRepost,
  threadOriginal,
  onReply,
  onOpen,
  onOpenOriginal,
  loading
}: Props) => {
  const theme = useTheme()
  const [likes, setLikes] = useState(0)
  const [isLiked, setIsLiked] = useState(false)

  const handleLike = (liked: boolean) => {
    setIsLiked(liked)
    setLikes((prev) => (liked ? prev + 1 : prev - 1))
  }

  return (
    <ThreadContainer key={threadId} activeOpacity={0.7} onPress={onOpen}>
      <ThreadHeader>
        <UserInfo>
          <TextUsername value={threadCreatorName} />
          <TextCreateDate value={threadCreatedAt} />
        </UserInfo>
      </ThreadHeader>

      {/* A repost's own title and body are optional. */}
      {threadTitle ? (
        <>
          <ThreadTitle>{threadTitle}</ThreadTitle>
          <Spacer space={8} />
        </>
      ) : null}

      {threadBody ? <ThreadContent>{threadBody}</ThreadContent> : null}

      {isRepost && <RepostQuote original={threadOriginal} onOpen={onOpenOriginal} />}

      <CardFooter.Footer>
        <CardFooter.Meta>
          <CardFooter.MetaItem>
            <ReplyIconButton onPress={onReply} count={threadReplyCount} loading={loading} />
          </CardFooter.MetaItem>
          <CardFooter.MetaItem>
            <GnodLikeButton
              loading={loading}
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

export default ThreadCardDetails
