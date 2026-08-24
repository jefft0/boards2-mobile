import { Post } from '@gno/types'
import CardFooter from '../../cards/CardFooter'
import { TextUsername } from '../../text'
import { ThreadContainer, ThreadContent, ThreadHeader, UserInfo } from './atoms'
import TextCreateDate from '../../text/TextCreateDate'

interface Props {
  loading?: boolean
  post?: Post
  onReply: () => void
  onOpen?: () => void
}

const ThreadCardReply = ({ post, onReply, onOpen, loading }: Props) => {
  return (
    <ThreadContainer activeOpacity={0.7} onPress={onOpen}>
      <ThreadHeader>
        <UserInfo>
          <TextUsername value={post?.user.name} />
          <TextCreateDate value={post?.createdAt} postId={post?.id} />
        </UserInfo>
      </ThreadHeader>

      <ThreadContent>{post?.body}</ThreadContent>

      <CardFooter.Footer>
        <CardFooter.Meta>
          <CardFooter.MetaItem>
            <CardFooter.MetaValue>Flag</CardFooter.MetaValue>
          </CardFooter.MetaItem>
          <CardFooter.MetaItem>
            <CardFooter.MetaValue>{post && post.n_replies > 0 ? `Reply [${post.n_replies}]` : 'Reply'}</CardFooter.MetaValue>
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
