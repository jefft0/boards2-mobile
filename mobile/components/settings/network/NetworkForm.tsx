import { useState } from 'react'
import { View } from 'react-native'
import styled from 'styled-components/native'
import { Button, Text as GnoText } from '@berty/gnonative-ui'
import Icons from '@gno/components/icons'
import { CUSTOM_NETWORK_ID, Network, NETWORKS } from '@gno/constants/networks'
import { switchNetwork, useAppDispatch } from '@gno/redux'
import { getActiveNetwork } from '@gno/utils/network-store'

const Container = styled.View`
  flex: 1;
  padding: 24px 16px;
  background-color: #ffffff;
`

const FormGroup = styled.View`
  margin-bottom: 24px;
`

const Input = styled.TextInput`
  width: 100%;
  padding: 12px 16px;
  border-width: 2px;
  border-color: #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  color: #111827;
  background-color: #ffffff;
`

const HelperText = styled.Text`
  font-size: 12px;
  color: #6b7280;
  margin-top: 8px;
`

const NetworkCard = styled.TouchableOpacity<{ selected: boolean }>`
  background-color: ${(props) => (props.selected ? '#f0f7ea' : '#f9fafb')};
  border-radius: 12px;
  padding: 16px;
  border-width: 1px;
  border-color: ${(props) => (props.selected ? '#2e5034' : '#e5e7eb')};
  margin-bottom: 12px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

const CardContent = styled.View`
  flex: 1;
  padding-right: 16px;
`

const CardTitle = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
`

const CardDetail = styled.Text`
  font-size: 12px;
  color: #6b7280;
  line-height: 18px;
`

const ButtonContainer = styled.View`
  gap: 12px;
  margin-top: 8px;
`

const sameNetwork = (a: Network, b: Network) => a.rpc === b.rpc && a.chainId === b.chainId

/**
 * Choose the network boards2 talks to.
 *
 * A network is picked whole — never as separate rpc/chainid fields — so a chain
 * ID cannot be paired with an endpoint serving a different chain (see
 * @gno/constants/networks). The custom entry captures both together for the same
 * reason.
 *
 * Switching signs the user out: the connected address and every cached board
 * belong to the previous chain (see `switchNetwork`).
 */
export default function NetworkForm({ onSwitched }: { onSwitched?: () => void }) {
  const dispatch = useAppDispatch()

  // In state rather than read per render: the active network lives outside
  // redux, so nothing would re-render this after a switch and the old selection
  // would stay highlighted, reading as a failed switch.
  const [active, setActive] = useState(getActiveNetwork())
  const [pending, setPending] = useState(false)

  const [customRpc, setCustomRpc] = useState(active.id === CUSTOM_NETWORK_ID ? active.rpc : '')
  const [customChainId, setCustomChainId] = useState(active.id === CUSTOM_NETWORK_ID ? active.chainId : '')

  const select = async (network: Network) => {
    if (sameNetwork(network, active) || pending) return
    try {
      setPending(true)
      await dispatch(switchNetwork(network)).unwrap()
      setActive(network)
      onSwitched?.()
    } catch (error) {
      console.error('could not switch network', error)
    } finally {
      setPending(false)
    }
  }

  const custom: Network = {
    id: CUSTOM_NETWORK_ID,
    label: 'Custom',
    rpc: customRpc.trim(),
    chainId: customChainId.trim()
  }
  const customReady = custom.rpc.length > 0 && custom.chainId.length > 0

  return (
    <Container>
      <FormGroup>
        {/* No label here: the screen header already reads "Network". */}
        <HelperText style={{ marginTop: 0, marginBottom: 12 }}>
          Signing in switches your wallet to this network. Changing it signs you out.
        </HelperText>

        {NETWORKS.map((network) => {
          const selected = sameNetwork(network, active)
          return (
            <NetworkCard
              key={network.id}
              selected={selected}
              activeOpacity={0.8}
              disabled={pending}
              onPress={() => select(network)}
            >
              <CardContent>
                <CardTitle>{network.label}</CardTitle>
                <CardDetail>{network.rpc}</CardDetail>
                <CardDetail>Chain ID: {network.chainId}</CardDetail>
              </CardContent>
              {/* Defaults to a white fill, invisible on the selected card. */}
              {selected ? <Icons.CheckMark color="#2e5034" /> : null}
            </NetworkCard>
          )
        })}
      </FormGroup>

      <FormGroup>
        <GnoText.Label>Custom RPC</GnoText.Label>
        <Input
          value={customRpc}
          onChangeText={setCustomRpc}
          placeholder="https://rpc.example.gno.land"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          inputMode="url"
        />
        <HelperText>Without a scheme, http:// is assumed.</HelperText>
      </FormGroup>

      <FormGroup>
        <GnoText.Label>Custom Chain ID</GnoText.Label>
        <Input
          value={customChainId}
          onChangeText={setCustomChainId}
          placeholder="e.g. topaz-1"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
        />
        <HelperText>Must be the chain ID that endpoint actually serves, or signing will fail.</HelperText>
      </FormGroup>

      <View style={{ flexGrow: 1 }} />

      <ButtonContainer>
        <Button
          onPress={() => select(custom)}
          disabled={!customReady || sameNetwork(custom, active) || pending}
          color="tertirary"
          activeOpacity={0.8}
        >
          {sameNetwork(custom, active) ? 'Custom network in use' : 'Use custom network'}
        </Button>
      </ButtonContainer>
    </Container>
  )
}
