import { ParentPost } from '@gno/types'
import CardFooter from '../../cards/CardFooter'
import ReplyIconButton from '../../button/ReplyIconButton'
import RepostIconButton from '../../button/RepostIconButton'
import { Spacer } from '@berty/gnonative-ui'
import { TextUsername } from '../../text'
import { ThreadContainer, ThreadContent, ThreadHeader, UserInfo, ThreadTitle } from './atoms'
import TextCreateDate from '@gno/components/text/TextCreateDate'
import RepostQuote from './RepostQuote'

interface Props {
  loading?: boolean
  threadId: string
  threadTitle: string
  threadBody?: string
  threadReplyCount?: number
  threadRepostCount?: number
  threadCreatorName?: string
  threadCreatedAt?: string
  isRepost?: boolean
  threadOriginal?: ParentPost
  onReply: () => void
  onOpen?: () => void
  onOpenOriginal?: () => void
  // Left out when showing a comment, which cannot be reposted.
  onRepost?: () => void
}

const ThreadCardDetails = ({
  threadId,
  threadTitle,
  threadBody,
  threadReplyCount,
  threadRepostCount,
  threadCreatorName,
  threadCreatedAt,
  isRepost,
  threadOriginal,
  onReply,
  onOpen,
  onOpenOriginal,
  onRepost,
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
          {/* Only a thread can be reposted, so a caller showing a comment omits onRepost. */}
          {onRepost ? (
            <CardFooter.MetaItem>
              <RepostIconButton onPress={onRepost} count={threadRepostCount} loading={loading} />
            </CardFooter.MetaItem>
          ) : null}
        </CardFooter.Meta>
      </CardFooter.Footer>
    </ThreadContainer>
  )
}

export default ThreadCardDetails
