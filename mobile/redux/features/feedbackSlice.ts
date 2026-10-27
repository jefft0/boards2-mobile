import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit'

export type Feedback = {
  id: string
  message: string
  kind: 'error'
}

interface FeedbackState {
  /** A queue, not one slot: a single action can fail twice (a broadcast
   *  rejects, then the reload behind it) and the second message must not
   *  replace the first before it has been read. */
  queue: Feedback[]
}

const initialState: FeedbackState = { queue: [] }

/**
 * The single channel for anything the user should be told about a failure.
 *
 * No screen dispatches into it by hand: `errorReporter` feeds it from rejected
 * thunks and wallet callbacks, so a new failure path is reported without the
 * screen that triggered it knowing this exists.
 */
export const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    reportError: {
      reducer: (state, action: PayloadAction<Feedback>) => {
        // Collapse repeats: a retry that fails the same way should not stack.
        if (state.queue.some((item) => item.message === action.payload.message)) return
        state.queue.push(action.payload)
      },
      prepare: (message: string) => ({ payload: { id: nanoid(), message, kind: 'error' as const } })
    },
    dismissFeedback: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter((item) => item.id !== action.payload)
    }
  },
  selectors: {
    selectCurrentFeedback: (state) => state.queue[0]
  }
})

export const { reportError, dismissFeedback } = feedbackSlice.actions
export const { selectCurrentFeedback } = feedbackSlice.selectors
