import { User } from '@gno/types'
import { getAccountName } from '@gno/redux'
import { useGnoNativeContext } from '@gnolang/gnonative'

const usersCache = new Map<string, User>()

const DEFAULT_AVATAR = 'https://www.gravatar.com/avatar/tmp'

export type UserCacheApi = {
  getUser: (bech32: string) => Promise<User>
  invalidateCache: () => void
}

export const useUserCache = () => {
  const { gnonative } = useGnoNativeContext()

  async function getUser(bech32: string): Promise<User> {
    if (usersCache.has(bech32)) {
      // Cached user
      return usersCache.get(bech32) as User
    }

    let name = await getAccountName(bech32, gnonative)
    const response = await gnonative.qEval('gno.land/r/demo/profile', `GetStringField("${bech32}","Avatar", "${DEFAULT_AVATAR}")`)
    const bech32Image = response.substring(2, response.length - '" string)'.length)

    const user = {
      name: name,
      password: '',
      pubKey: '',
      address: await gnonative.addressFromBech32(bech32),
      avatar: bech32Image,
      bech32: ''
    }

    usersCache.set(bech32, user)

    return user
  }

  function invalidateCache() {
    usersCache.clear()
  }
  return { getUser, invalidateCache }
}
