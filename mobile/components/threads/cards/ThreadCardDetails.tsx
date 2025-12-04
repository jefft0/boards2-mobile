import { Post } from '@gno/types'
import { useTheme } from 'styled-components/native'
import CardFooter from '../../cards/CardFooter'
import GnodLikeButton from '../../button/GnodLikeButton'
import { useState } from 'react'
import ReplyIconButton from '../../button/ReplyIconButton'
import { Spacer, Text } from '@berty/gnonative-ui'
import { TextUsername } from '../../text'
import { ThreadContainer, ThreadContent, ThreadHeader, UserInfo } from './atoms'
import TextCreateDate from '@gno/components/text/TextCreateDate'

interface Props {
  loading?: boolean
  thread?: Post
  onReply: () => void
  onOpen?: () => void
}

const ThreadCardDetails = ({ thread, onReply, onOpen, loading }: Props) => {
  const theme = useTheme()
  const [likes, setLikes] = useState(0)
  const [isLiked, setIsLiked] = useState(false)

  const handleLike = (liked: boolean) => {
    setIsLiked(liked)
    setLikes((prev) => (liked ? prev + 1 : prev - 1))
  }

  return (
    <ThreadContainer key={thread?.id} activeOpacity={0.7} onPress={onOpen}>
      <ThreadHeader>
        <UserInfo>
          <TextUsername value={thread?.user.name} />
          <TextCreateDate value={thread?.createdAt} />
        </UserInfo>
      </ThreadHeader>

      <Text.Title3>{thread?.title}</Text.Title3>
      <Spacer space={8} />

      <ThreadContent>{thread?.body}</ThreadContent>

      <CardFooter.Footer>
        <CardFooter.Meta>
          <CardFooter.MetaItem>
            <ReplyIconButton showLabel onPress={onReply} count={thread?.n_replies ?? 0} />
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

export default ThreadCardDetails
