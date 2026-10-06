import { ParentPost } from '@gno/types'
import { Spacer } from '@berty/gnonative-ui'
import { QuotedThread, RepostNote, ThreadTitle, ThreadContent } from './atoms'

interface Props {
  original?: ParentPost
  onOpen?: () => void
}

// The summary of the thread a repost points at.
const RepostQuote = ({ original, onOpen }: Props) => {
  return (
    <QuotedThread activeOpacity={0.7} onPress={onOpen} disabled={!original}>
      {original ? (
        <>
          <RepostNote>⟳ Reposted from @{original.user.name}</RepostNote>
          <ThreadTitle>{original.title}</ThreadTitle>
          <Spacer space={8} />

          <ThreadContent>{original.body}</ThreadContent>
        </>
      ) : (
        <RepostNote>⚠ The reposted thread is no longer available</RepostNote>
      )}
    </QuotedThread>
  )
}

export default RepostQuote
