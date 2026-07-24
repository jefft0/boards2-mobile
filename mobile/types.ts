import { KeyInfo } from '@gnolang/gnonative'

type PostInterface = {
  user: User
  id: number
  originalBoardId: number
  originalThreadId: number
  boardId: number
  title: string
  body: string
  hidden: boolean
  readOnly: boolean
  n_replies: number
  n_gnods: number
  createdAt: string
  updatedAt: string
}
export type ParentPost = PostInterface

export type Post = {
  repost_parent?: ParentPost
} & PostInterface

export interface User extends Pick<KeyInfo, 'address' | 'name'> {
  bech32: string
  avatar?: string
}

export interface ThreadPosts {
  data: Post[]
  n_posts: number
}
