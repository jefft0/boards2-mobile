import { Post } from '@gno/types'
import styled, { useTheme } from 'styled-components/native'
import CardFooter from '../cards/CardFooter'
import GnodLikeButton from '../button/GnodLikeButton'
import { useState } from 'react'
import ReplyIconButton from '../button/ReplyIconButton'

const Container = styled.TouchableOpacity`
  background-color: #ffffff;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f3f4f6;
  active-opacity: 0.7;
`

const ThreadHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`

const ThreadTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  flex: 1;
  margin-right: 12px;
`

const ThreadPreview = styled.Text`
  font-size: 14px;
  color: #6b7280;
  line-height: 20px;
  margin-bottom: 12px;
`

interface Props {
  thread: Post
  onReply: () => void
}

const ThreadCard = ({ thread, onReply }: Props) => {
  const theme = useTheme()
  const [likes, setLikes] = useState(0)
  const [isLiked, setIsLiked] = useState(false)

  const handleLike = (liked: boolean) => {
    setIsLiked(liked)
    setLikes((prev) => (liked ? prev + 1 : prev - 1))
  }

  return (
    <Container key={thread.id} activeOpacity={0.7}>
      <ThreadHeader>
        <ThreadTitle>{thread.title}</ThreadTitle>
        {/* {thread.pinned && (
                <ThreadBadge pinned>
                  <BadgeText pinned>Pinned</BadgeText>
                </ThreadBadge>
              )} */}
      </ThreadHeader>

      <ThreadPreview numberOfLines={2}>{thread.body}</ThreadPreview>

      <CardFooter.Footer>
        <CardFooter.Meta>
          <CardFooter.MetaItem style={{ minWidth: 120 }}>
            <CardFooter.MetaValue color={theme.colors.primary}>@{thread.user.name}</CardFooter.MetaValue>
          </CardFooter.MetaItem>
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
    </Container>
  )
}

export default ThreadCard
