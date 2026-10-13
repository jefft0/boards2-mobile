import { useState } from 'react'
import { HiddenNote, RevealToggle, RevealToggleText, ThreadContent } from './atoms'

interface Props {
  // The flagged body, shown only once the user asks for it.
  body?: string
}

// What a card shows in place of the body of a post the realm hid, which is a
// post flagged as inappropriate. The notice matches the wording of the realm's
// own render (render_post.gno), minus its link to the flagging reasons, which
// the app has no screen for yet.
const HiddenNotice = ({ body }: Props) => {
  const [revealed, setRevealed] = useState(false)

  return (
    <>
      <HiddenNote>⚠ Reply is hidden as it has been flagged as inappropriate</HiddenNote>

      {/* A toggle, so the user can put the body back out of sight after a look.
          Pressing it doesn't open the post: a nested TouchableOpacity wins the
          touch over the card containing it. */}
      <RevealToggle activeOpacity={0.7} onPress={() => setRevealed(!revealed)}>
        <RevealToggleText>{revealed ? 'Hide' : 'Show'}</RevealToggleText>
      </RevealToggle>

      {revealed ? <ThreadContent>{body}</ThreadContent> : null}
    </>
  )
}

export default HiddenNotice
