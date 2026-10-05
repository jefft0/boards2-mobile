import { createAppAsyncThunk } from '../utils/async-thunk'
import { UserCacheApi } from '@gno/hooks/use-user-cache'
import { Comment, Post } from '@gno/types'
import { GnoNativeApi } from '@gnolang/gnonative'
import { createSlice } from '@reduxjs/toolkit'
import { ThunkExtra, fetchComment, fetchCommentReplies, fetchThread, fetchThreadComments, subtractOrZero } from '@gno/redux'

// What one detail screen shows: a thread with its comments, or a comment with
// its replies.
interface DetailState {
  loading: boolean
  error?: string
  thread?: Post
  comment?: Comment
  replies: Comment[]
  totalPosts: number
}

// A comment screen can open another comment screen, so each screen keeps its own
// state and a screen deeper in the stack doesn't overwrite the one it came from.
interface ThreadDetailState {
  byKey: Record<string, DetailState>
}

const initialState: ThreadDetailState = {
  byKey: {}
}

const emptyDetail: DetailState = {
  loading: false,
  error: undefined,
  thread: undefined,
  comment: undefined,
  replies: [],
  totalPosts: 0
}

// The key of the screen showing a thread, or a comment when commentId is given.
export function detailKey(boardId: number | string, threadId: number | string, commentId?: number | string): string {
  return `${boardId}/${threadId}/${commentId ?? 0}`
}

function keyOf({ boardId, threadId, commentId }: LoadThreadDetailRequest): string {
  return detailKey(boardId, threadId, commentId)
}

const PAGE_SIZE = 20

export const threadDetailSlice = createSlice({
  name: 'threadDetail',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(loadThreadDetail.fulfilled, (state, action) => {
      state.byKey[keyOf(action.meta.arg)] = {
        loading: false,
        error: undefined,
        thread: action.payload?.thread,
        comment: action.payload?.comment,
        replies: action.payload?.replies || [],
        totalPosts: action.payload?.totalPosts || 0
      }
    })
    builder.addCase(loadThreadDetail.pending, (state, action) => {
      state.byKey[keyOf(action.meta.arg)] = { ...emptyDetail, loading: true }
    })
    builder.addCase(loadThreadDetail.rejected, (state, action) => {
      const detail = state.byKey[keyOf(action.meta.arg)] ?? emptyDetail
      state.byKey[keyOf(action.meta.arg)] = { ...detail, loading: false, error: action.error.message }
    })
  },
  selectors: {
    selectThreadDetail: (state: ThreadDetailState, key: string) => state.byKey[key]?.thread,
    selectCommentDetail: (state: ThreadDetailState, key: string) => state.byKey[key]?.comment,
    selectThreadReplies: (state: ThreadDetailState, key: string) => state.byKey[key]?.replies ?? emptyDetail.replies,
    selectThreadDetailLoading: (state: ThreadDetailState, key: string) => state.byKey[key]?.loading ?? false
  }
})

export const { selectThreadReplies, selectThreadDetailLoading, selectThreadDetail, selectCommentDetail } =
  threadDetailSlice.selectors

export type LoadThreadDetailRequest = {
  boardId: number
  threadId: number
  // When given, show this comment and its replies instead of the thread and its comments.
  commentId?: number
}

export type LoadThreadDetailResult = {
  thread?: Post
  comment?: Comment
  replies: Comment[]
  totalPosts: number
}

export const loadThreadDetail = createAppAsyncThunk<LoadThreadDetailResult | undefined, LoadThreadDetailRequest, ThunkExtra>(
  'threadDetail/loadThreadDetail',
  async ({ boardId, threadId, commentId }, thunkAPI) => {
    const gnonative = thunkAPI.extra.gnonative as GnoNativeApi
    const userCache = thunkAPI.extra.userCache as UserCacheApi

    try {
      if (commentId) {
        // Show the comment and its replies.
        const comment = await fetchComment(userCache, gnonative, boardId, threadId, commentId)
        const totalPosts = comment?.n_replies ?? 0
        const startIndex = subtractOrZero(totalPosts, PAGE_SIZE)

        // endIndex and total are the same value here: the screen opens on the
        // last page, which ends at the last reply.
        const res = await fetchCommentReplies(
          userCache,
          gnonative,
          boardId,
          threadId,
          commentId,
          startIndex,
          totalPosts,
          totalPosts
        )

        return {
          comment,
          replies: res.data,
          totalPosts
        }
      } else {
        // Show the thread and its top level comments. Fetching the thread rather
        // than taking it from the list of the board we came from serves two
        // purposes: the list has nothing for a thread of another board, like the
        // one a repost points at, and paging needs a comment count as fresh as
        // the comments themselves.
        const thread = await fetchThread(userCache, gnonative, boardId, threadId)
        const totalPosts = thread?.n_replies ?? 0
        const startIndex = subtractOrZero(totalPosts, PAGE_SIZE)

        // endIndex and total are the same value here, as in the branch above.
        const res = await fetchThreadComments(userCache, gnonative, boardId, threadId, startIndex, totalPosts, totalPosts)

        return {
          thread,
          replies: res.data,
          totalPosts
        }
      }
    } catch (error) {
      console.error('error in loadThreadDetail thunk:', error)
      throw error
    }
  }
)
