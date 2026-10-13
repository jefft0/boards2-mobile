import { DELETED_POST_BODY } from '@gno/constants/Constants'
import { fetchOriginalBody } from '@gno/utils/indexer'
import HiddenNotice from './HiddenNotice'
import { ThreadContent } from './atoms'

interface Props {
  // The IDs of the post itself, to look up its original body when it is
  // deleted. `postId` is the ID of the thread, comment or reply shown.
  boardId?: number
  postId?: number
  body?: string
  hidden?: boolean
}

// The body of a post, or a notice in its place when the realm hid or deleted
// it. The two cases differ in where the hidden text lives: a flagged post keeps
// its body on chain, while a deleted one has had it overwritten and only the
// transaction that created it still holds the original.
const PostBody = ({ boardId, postId, body, hidden }: Props) => {
  if (hidden) {
    return <HiddenNotice notice="⚠ Reply is hidden as it has been flagged as inappropriate" getBody={() => body} />
  }

  if (body === DELETED_POST_BODY) {
    // The realm's own text is the body here, so show it as the notice.
    const getBody = () => (boardId === undefined || postId === undefined ? undefined : fetchOriginalBody(boardId, postId))

    return <HiddenNotice notice={body} getBody={getBody} />
  }

  return body ? <ThreadContent>{body}</ThreadContent> : null
}

export default PostBody
