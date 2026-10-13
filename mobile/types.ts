import { KeyInfo } from '@gnolang/gnonative'

// The fields a thread and a comment have in common, so that a component like
// ThreadCardReply can show either one.
export type PostBase = {
  user: User
  id: number
  boardId: number
  body: string
  hidden: boolean
  // True for a post the realm no longer holds, which it deletes outright when
  // it has no replies. Such a post is shown from what the indexer kept of it,
  // and the realm refuses a reply to it.
  missing?: boolean
  n_replies: number
  createdAt: string
  updatedAt: string
}

type PostInterface = PostBase & {
  originalBoardId: number
  originalThreadId: number
  title: string
  readOnly: boolean
  n_reposts: number
  n_gnods: number
}
export type ParentPost = PostInterface

export type Post = {
  repost_parent?: ParentPost
} & PostInterface

// A thread comment or reply, following hubexts.Comment in the realm. A top
// level comment's parentId is its threadId, while a reply's parentId is the
// comment or reply it answers.
export type Comment = PostBase & {
  threadId: number
  parentId: number
  n_flags: number
}

export interface User extends Pick<KeyInfo, 'address' | 'name'> {
  bech32: string
  avatar?: string
}

export interface ThreadPosts {
  data: Post[]
  n_posts: number
}

export interface ThreadComments {
  data: Comment[]
  n_posts: number
}
