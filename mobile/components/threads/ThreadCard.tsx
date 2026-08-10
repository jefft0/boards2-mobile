import { Post } from '@gno/types'
import { useTheme } from 'styled-components/native'
import CardFooter from '../cards/CardFooter'
import ReplyIconButton from '../button/ReplyIconButton'
import RepostIconButton from '../button/RepostIconButton'
import { ThreadContainer, ThreadTitle, ThreadContent } from './cards/atoms'
import RepostQuote from './cards/RepostQuote'
import { Spacer } from '@berty/gnonative-ui'

interface Props {
  thread: Post
  onReply: () => void
  onOpen?: () => void
  onOpenOriginal?: () => void
  onRepost: () => void
}

const ThreadCard = ({ thread, onReply, onOpen, onOpenOriginal, onRepost }: Props) => {
  const theme = useTheme()

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

      {isRepost && <RepostQuote original={original} onOpen={onOpenOriginal} />}

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
            <RepostIconButton onPress={onRepost} count={thread.n_reposts} />
          </CardFooter.MetaItem>
        </CardFooter.Meta>
      </CardFooter.Footer>
    </ThreadContainer>
  )
}

export default ThreadCard
