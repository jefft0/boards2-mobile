import { PostBase } from '@gno/types'
import { TouchableOpacity } from 'react-native'
import { useTheme } from 'styled-components/native'
import CardFooter from '../../cards/CardFooter'
import Icons from '../../icons'
import { TextUsername } from '../../text'
import { ThreadContainer, ThreadContent, ThreadHeader, UserInfo } from './atoms'
import TextCreateDate from '../../text/TextCreateDate'

interface Props {
  loading?: boolean
  // PostBase, so that this can show a thread or a comment.
  post?: PostBase
  onReply: () => void
  onOpen?: () => void
  onDelete?: () => void
}

const ThreadCardReply = ({ post, onReply, onOpen, onDelete, loading }: Props) => {
  const theme = useTheme()

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
          {onDelete ? (
            <CardFooter.MetaItem>
              <TouchableOpacity onPress={onDelete} accessibilityRole="button" accessibilityLabel="Delete">
                <Icons.Trash size={16} color={theme.text.textMuted} />
              </TouchableOpacity>
            </CardFooter.MetaItem>
          ) : null}
        </CardFooter.Meta>
      </CardFooter.Footer>
    </ThreadContainer>
  )
}

export default ThreadCardReply
