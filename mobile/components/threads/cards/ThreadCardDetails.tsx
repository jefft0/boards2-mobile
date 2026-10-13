import { ParentPost } from '@gno/types'
import CardFooter from '../../cards/CardFooter'
import ReplyIconButton from '../../button/ReplyIconButton'
import RepostIconButton from '../../button/RepostIconButton'
import { Spacer } from '@berty/gnonative-ui'
import { TextUsername } from '../../text'
import { ThreadContainer, ThreadContent, ThreadHeader, UserInfo, ThreadTitle } from './atoms'
import TextCreateDate from '@gno/components/text/TextCreateDate'
import RepostQuote from './RepostQuote'
import HiddenNotice from './HiddenNotice'

interface Props {
  loading?: boolean
  threadId: string
  threadTitle: string
  threadBody?: string
  // True when the realm hid the post, which it does for a flagged one.
  threadHidden?: boolean
  threadReplyCount?: number
  threadRepostCount?: number
  threadCreatorName?: string
  threadCreatedAt?: string
  isRepost?: boolean
  threadOriginal?: ParentPost
  onReply: () => void
  onOpen?: () => void
  onOpenOriginal?: () => void
  // Left out for a post the realm will not repost: a comment, or a repost itself.
  onRepost?: () => void
}

const ThreadCardDetails = ({
  threadId,
  threadTitle,
  threadBody,
  threadHidden,
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

      {/* The notice comes before the empty-body check: a hidden post needs it
          whether or not it has a body to reveal. */}
      {threadHidden ? <HiddenNotice body={threadBody} /> : null}
      {!threadHidden && threadBody ? <ThreadContent>{threadBody}</ThreadContent> : null}

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
