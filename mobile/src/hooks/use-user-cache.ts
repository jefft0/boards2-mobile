import { User } from '@gno/types'
import { useGnoNativeContext } from '@gnolang/gnonative'

const usersCache = new Map<string, User>()

const DEFAULT_AVATAR = 'https://www.gravatar.com/avatar/tmp'

export const useUserCache = () => {
  const { gnonative } = useGnoNativeContext()

  async function getUser(bech32: string): Promise<User> {
    //bech32 = "g1juz2yxmdsa6audkp6ep9vfv80c8p5u76e03vvh" // debug until we detect if bech32 is a username
    if (usersCache.has(bech32)) {
      // Cached user
      return usersCache.get(bech32) as User
    }

    let name = bech32
    try {
      const result = await gnonative.qEval('gno.land/r/sys/users', `ResolveAddress("${bech32}").Name()`)
      const match = result.match(/\("(\w+)"/)
      if (match) {
        name = match[1]
      }
    } catch (error) {
      console.error('Error in ResolveAddress', error)
    }

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
