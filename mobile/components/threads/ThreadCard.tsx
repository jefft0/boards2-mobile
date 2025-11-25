import { Post } from '@gno/types'
import styled, { useTheme } from 'styled-components/native'
import Icons from '../icons'
import CardFooter from '../cards/CardFooter'

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

const ThreadCard = ({ thread }: { thread: Post }) => {
  const theme = useTheme()
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
          <CardFooter.MetaItem>
            <CardFooter.MetaValue color={theme.colors.primary}>@{thread.user.name}</CardFooter.MetaValue>
          </CardFooter.MetaItem>
          <CardFooter.MetaItem>
            <CardFooter.MetaValue>{thread.n_replies} Replies</CardFooter.MetaValue>
          </CardFooter.MetaItem>
          <CardFooter.MetaItem>
            <CardFooter.MetaIcon>{thread.n_gnods > 0 ? <Icons.Gnoded /> : <Icons.Gnod />}</CardFooter.MetaIcon>
            <CardFooter.MetaValue>{thread.n_gnods} Gnods</CardFooter.MetaValue>
          </CardFooter.MetaItem>
        </CardFooter.Meta>
      </CardFooter.Footer>
    </Container>
  )
}

export default ThreadCard
