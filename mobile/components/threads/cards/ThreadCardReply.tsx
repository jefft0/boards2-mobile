import { Post } from '@gno/types'
import CardFooter from '../../cards/CardFooter'
import { TextUsername } from '../../text'
import { ThreadContainer, ThreadContent, ThreadHeader, UserInfo } from './atoms'
import TextCreateDate from '../../text/TextCreateDate'

interface Props {
  loading?: boolean
  thread?: Post
  onReply: () => void
  onOpen?: () => void
}

const ThreadCardReply = ({ thread, onReply, onOpen, loading }: Props) => {
  return (
    <ThreadContainer key={thread?.id} activeOpacity={0.7} onPress={onOpen}>
      <ThreadHeader>
        <UserInfo>
          <TextUsername value={thread?.user.name} />
          <TextCreateDate value={thread?.createdAt} />
        </UserInfo>
      </ThreadHeader>

      <ThreadContent>{thread?.body}</ThreadContent>

      <CardFooter.Footer>
        <CardFooter.Meta>
          <CardFooter.MetaItem>
            <CardFooter.MetaValue>Flag</CardFooter.MetaValue>
          </CardFooter.MetaItem>
          <CardFooter.MetaItem>
            <CardFooter.MetaValue>Reply</CardFooter.MetaValue>
          </CardFooter.MetaItem>
          <CardFooter.MetaItem>
            <CardFooter.MetaValue>Edit</CardFooter.MetaValue>
          </CardFooter.MetaItem>
          <CardFooter.MetaItem>
            <CardFooter.MetaValue>Delete</CardFooter.MetaValue>
          </CardFooter.MetaItem>
        </CardFooter.Meta>
      </CardFooter.Footer>
    </ThreadContainer>
  )
}

export default ThreadCardReply
