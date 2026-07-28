import { useEffect } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { dismissFeedback, selectCurrentFeedback, useAppDispatch, useAppSelector } from '@gno/redux'
import Text from '@gno/components/text'
import Icons from '@gno/components/icons'

/** Long enough to read a sentence; the user can dismiss sooner. */
const VISIBLE_MS = 6000

/**
 * The one place a failure is shown to the user.
 *
 * Mounted once at the app root rather than per screen, because the failures it
 * reports arrive after a round trip through the wallet — by then the screen that
 * started the action may have been replaced, or the app relaunched. A snackbar
 * also does not block: these are things that went wrong, not decisions to make,
 * so it must not sit in front of a screen waiting to be acknowledged.
 *
 * Form-level validation stays inline next to its field; this is for the results
 * of an action the user has already committed to.
 */
export default function ErrorSnackbar() {
  const feedback = useAppSelector(selectCurrentFeedback)
  const dispatch = useAppDispatch()
  const insets = useSafeAreaInsets()

  const id = feedback?.id

  useEffect(() => {
    if (!id) return
    const timer = setTimeout(() => dispatch(dismissFeedback(id)), VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [id, dispatch])

  if (!feedback) return null

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={styles.snackbar}>
        {/* Clamped: a long realm rejection must not grow the bar until it
            covers the screen it is reporting on. */}
        <Text.Body style={styles.message} numberOfLines={3}>
          {feedback.message}
        </Text.Body>
        <TouchableOpacity onPress={() => dispatch(dismissFeedback(feedback.id))} hitSlop={12} accessibilityLabel="Dismiss">
          <Icons.Close color="#7A1A1C" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFE5E6',
    borderColor: '#FA262A',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  message: {
    flex: 1,
    color: '#7A1A1C'
  }
})
