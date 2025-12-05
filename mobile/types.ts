import { KeyInfo } from '@gnolang/gnonative'

type PostInterface = {
  user: User
  title: string
  body: string
  boardId: number
  createdAt: string
  id: number
  n_replies: number
  n_gnods: number
  n_replies_all: number
  thread_id: number
  parent_id: number
}
export type ParentPost = PostInterface

export type Post = {
  repost_parent?: ParentPost
} & PostInterface

export interface User extends Pick<KeyInfo, 'address' | 'name'> {
  bech32: string
  avatar?: string
}

export type GnoConfig = {
  Remote: string
  ChainID: string
  KeyName: string
  Password: string
  GasFee: string
  GasWanted: bigint
  Mnemonic: string
}

export type NetworkMetainfo = {
  chainId: string
  chainName: string
  gnoAddress: string
}

export type GnoAccount = KeyInfo

export interface ThreadPosts {
  data: Post[]
  n_posts: number
}
