import { TouchableOpacity } from 'react-native'
import Icons from '@gno/components/icons'
import { Text } from '@berty/gnonative-ui'
import styled, { useTheme } from 'styled-components/native'

interface ActionButtonProps {
  icon?: keyof typeof Icons
  label: string
  onPress: () => void
  disabled?: boolean
}

export const ActionButton = ({ icon, label, onPress, disabled }: ActionButtonProps) => {
  const theme = useTheme()
  const IconComponent = icon ? Icons[icon] : null
  const iconColor = disabled ? theme.text.textMuted : theme.colors.primary

  return (
    <ActionButtonWrapper onPress={onPress} disabled={disabled} accessibilityState={{ disabled }} $disabled={disabled}>
      {IconComponent && (
        <IconContainer>
          <IconComponent color={iconColor} size={22} />
        </IconContainer>
      )}
      <Label $disabled={disabled}>{label}</Label>
    </ActionButtonWrapper>
  )
}

const ActionButtonWrapper = styled(TouchableOpacity)<{ $disabled?: boolean }>`
  flex-direction: row;
  align-items: center;
  padding: 8px 0px;
  opacity: ${(p) => (p.$disabled ? 0.5 : 1)};
`

const IconContainer = styled.View`
  margin-right: 2px;
`

const Label = styled(Text.Body)<{ $disabled?: boolean }>`
  color: ${(p) => (p.$disabled ? p.theme.text.textMuted : p.theme.colors.primary)};
`
