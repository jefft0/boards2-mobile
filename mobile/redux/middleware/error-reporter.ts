import { isRejected } from '@reduxjs/toolkit'
import { reportError } from '../features/feedbackSlice'
import { setLinkingData } from '../features/linkingSlice'
import { describeError, describeLinkingFailure } from '@gno/utils/describe-error'
import { reloadAvatar } from '../features/accountSlice'

/**
 * Thunks whose failure the user should not be told about.
 *
 * A deny-list, not an allow-list: a thunk added later is reported by default,
 * and silence is the choice that has to be justified.
 */
const SILENT = [
  // Avatars are best-effort by design — a missing one falls back to the default
  // and is not worth interrupting the user over.
  reloadAvatar.typePrefix
]

const isSilent = (type: string) => SILENT.some((prefix) => type.startsWith(prefix))

/**
 * Routes every user-visible failure into the feedback queue.
 *
 * Two shapes reach the user: a rejected thunk, and a non-success wallet
 * callback — a plain action rather than a rejection, because the wallet
 * answered, just not `success`.
 *
 * Here rather than in each screen, because these actions round-trip through the
 * wallet: the OS may have evicted and relaunched the app by the time the answer
 * arrives, so screen-local state is gone exactly when the error needs showing.
 */
// Typed structurally: this project's `redux` types do not resolve, so RTK's
// `Middleware` is unusable here — as with `Reducer` in redux-provider.
type ReporterAction = { type: string; error?: unknown; meta?: { condition?: boolean } }

export const errorReporter =
  (store: { dispatch: (action: unknown) => unknown }) =>
  (next: (action: ReporterAction) => unknown) =>
  (action: ReporterAction) => {
    const result = next(action)

    if (setLinkingData.match(action)) {
      const q = (action.payload as { queryParams?: Record<string, unknown> })?.queryParams ?? {}
      if (q.status && q.status !== 'success') {
        store.dispatch(reportError(describeLinkingFailure({ status: q.status as string, code: q.code as string | undefined })))
      }
      return result
    }

    if (isRejected(action) && !isSilent(action.type)) {
      // `condition`-aborted thunks never ran; they are not failures.
      if (action.meta?.condition) return result
      store.dispatch(reportError(describeError(action.error)))
    }

    return result
  }
