import { useState } from 'react'
import { HiddenNote, RevealToggle, RevealToggleText, ThreadContent } from './atoms'

interface Props {
  // What to show in place of the body.
  notice: string
  // Resolves the body to reveal. A deleted post has to fetch it, so this is
  // called when the user asks for it rather than on render.
  getBody: () => string | undefined | Promise<string | undefined>
}

// What a card shows in place of the body of a post the realm hid or deleted,
// with a toggle to reveal the text anyway. The wording of a hidden post follows
// the realm's own render (render_post.gno), minus its link to the flagging
// reasons, which the app has no screen for yet.
const HiddenNotice = ({ notice, getBody }: Props) => {
  const [revealed, setRevealed] = useState(false)
  const [body, setBody] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const onToggle = async () => {
    if (revealed) {
      setRevealed(false)
      return
    }

    // Keep what was fetched once, so hiding and showing again is free.
    if (body === undefined) {
      setLoading(true)
      setError(false)
      try {
        setBody(await getBody())
      } catch (e) {
        console.error('on fetching the body of a hidden post', e)
        setError(true)
        setLoading(false)
        return
      }
      setLoading(false)
    }

    setRevealed(true)
  }

  return (
    <>
      <HiddenNote>{notice}</HiddenNote>

      {/* A toggle, so the user can put the body back out of sight after a look.
          Pressing it doesn't open the post: a nested TouchableOpacity wins the
          touch over the card containing it. */}
      <RevealToggle activeOpacity={0.7} disabled={loading} onPress={onToggle}>
        <RevealToggleText>{loading ? 'Loading…' : revealed ? 'Hide' : 'Show'}</RevealToggleText>
      </RevealToggle>

      {error ? <HiddenNote>The original text could not be loaded</HiddenNote> : null}
      {/* The post is known but its text is not: the indexer has no transaction
          creating it, as happens on a chain whose history the indexer misses. */}
      {revealed && body === undefined ? <HiddenNote>The original text is not available</HiddenNote> : null}
      {revealed && body !== undefined ? <ThreadContent>{body}</ThreadContent> : null}
    </>
  )
}

export default HiddenNotice
