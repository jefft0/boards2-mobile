import React, { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import {
  accountSlice,
  profileSlice,
  linkingSlice,
  boardsSlice,
  threadsSlice,
  boardsCreateSlice,
  threadReplySlice,
  threadsCreateSlice,
  threadDetailSlice,
  switchNetwork
} from './features'
import { GnoNativeApi, useGnoNativeContext } from '@gnolang/gnonative'
import { useUserCache } from '@gno/hooks/use-user-cache'

interface Props {
  children: React.ReactNode
}

export interface ThunkExtra {
  extra: {
    gnonative: GnoNativeApi
    userCache: ReturnType<typeof useUserCache>
  }
}

/**
 * Clears a slice when the network changes (see `switchNetwork`): passing
 * `undefined` makes the wrapped reducer return its own initial state.
 *
 * Applied at the map below so that a slice is wrapped on the same line that
 * registers it — an unwrapped slice would silently keep another chain's data,
 * which surfaces as wrong content rather than as an error.
 */
const resetOnNetworkSwitch =
  <S, A extends { type: string }>(sliceReducer: (state: S | undefined, action: A) => S) =>
  (state: S | undefined, action: A): S =>
    sliceReducer(action.type === switchNetwork.fulfilled.type ? undefined : state, action)

const reducer = {
  [accountSlice.reducerPath]: resetOnNetworkSwitch(accountSlice.reducer),
  [profileSlice.reducerPath]: resetOnNetworkSwitch(profileSlice.reducer),
  [linkingSlice.reducerPath]: resetOnNetworkSwitch(linkingSlice.reducer),
  [threadsSlice.reducerPath]: resetOnNetworkSwitch(threadsSlice.reducer),
  [boardsSlice.reducerPath]: resetOnNetworkSwitch(boardsSlice.reducer),
  [boardsCreateSlice.reducerPath]: resetOnNetworkSwitch(boardsCreateSlice.reducer),
  [threadReplySlice.reducerPath]: resetOnNetworkSwitch(threadReplySlice.reducer),
  [threadsCreateSlice.reducerPath]: resetOnNetworkSwitch(threadsCreateSlice.reducer),
  [threadDetailSlice.reducerPath]: resetOnNetworkSwitch(threadDetailSlice.reducer)
}

export type RootState = typeof reducer

const ReduxProvider: React.FC<Props> = ({ children }) => {
  // Exposing GnoNative API to reduxjs/toolkit
  const { gnonative } = useGnoNativeContext()
  const userCache = useUserCache()
  const [store, setStore] = useState<any>(null)

  useEffect(() => {
    if (store) return // Prevent re-initialization

    const storeInstance = configureStore({
      reducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,

          thunk: {
            // To make Thunk inject gnonative in all Thunk objects.
            // https://redux.js.org/tutorials/essentials/part-6-performance-normalization#thunk-arguments
            extraArgument: {
              gnonative,
              userCache
            }
          }
        })
    })
    setStore(storeInstance)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store])

  if (!store) return null

  return <Provider store={store}>{children}</Provider>
}

export { ReduxProvider }
