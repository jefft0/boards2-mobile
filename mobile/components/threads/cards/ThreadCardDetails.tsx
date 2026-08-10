import { ParentPost, Post } from '@gno/types'
import CardFooter from '../../cards/CardFooter'
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
        </CardFooter.Meta>
      </CardFooter.Footer>
    </ThreadContainer>
  )
}

export default ThreadCardDetails
