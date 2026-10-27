import { createAsyncThunk, miniSerializeError } from '@reduxjs/toolkit'
import type { AsyncThunkConfig, AsyncThunkOptions, AsyncThunkPayloadCreator } from '@reduxjs/toolkit'
import { errDetailOf } from '@gnolang/gnonative'

/**
 * Keeps gnonative's `ErrDetails` on a rejected thunk.
 *
 * RTK flattens a rejection to `{ name, message, stack, code }` before any
 * reducer or middleware runs, so the `ConnectError` and its detail are gone by
 * the time `errorReporter` sees it. Serialising is the last point they can be
 * read, hence a `serializeError` rather than middleware.
 *
 * `code` is stringified because RTK copies those properties only when they are
 * strings, so a numeric ErrCode would be dropped without a word. The message
 * becomes gnonative's wording for the code, replacing raw text that names an
 * internal RPC method; `describeError` may override it per code.
 */
export const serializeGnoError = (error: unknown) => {
  const serialized = miniSerializeError(error)
  const detail = errDetailOf(error)
  if (!detail) return serialized

  return {
    ...serialized,
    code: String(detail.code),
    message: detail.message || serialized.message
  }
}

/**
 * `createAsyncThunk` with the serializer above. Every thunk should use it, so a
 * failure keeps its ErrCode whichever call produced it — including one thrown
 * while iterating a stream, which a wrapper around the client would never see.
 */
export function createAppAsyncThunk<Returned, ThunkArg = void, ThunkApiConfig extends AsyncThunkConfig = object>(
  typePrefix: string,
  payloadCreator: AsyncThunkPayloadCreator<Returned, ThunkArg, ThunkApiConfig>,
  options?: AsyncThunkOptions<ThunkArg, ThunkApiConfig>
) {
  return createAsyncThunk<Returned, ThunkArg, ThunkApiConfig>(typePrefix, payloadCreator, {
    serializeError: serializeGnoError,
    ...options
    // `serializeError`'s type is derived from ThunkApiConfig, which none of
    // these thunks customise; TypeScript cannot see that generically.
  } as AsyncThunkOptions<ThunkArg, ThunkApiConfig>)
}
