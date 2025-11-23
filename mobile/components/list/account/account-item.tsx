import { Spacer, Button } from '@berty/gnonative-ui'
import { GnoAccount } from '@gno/types'

interface SideMenuAccountItemProps {
  account: GnoAccount
  changeAccount: (account: GnoAccount) => void
}

const SideMenuAccountItem = (props: SideMenuAccountItemProps) => {
  const { account, changeAccount } = props
  return (
    <>
      <Spacer />
      <Button onPress={() => changeAccount(account)}>{account.name}</Button>
    </>
  )
}

export default SideMenuAccountItem
