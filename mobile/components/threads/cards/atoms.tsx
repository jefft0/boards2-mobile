import { Text } from '@berty/gnonative-ui'
import styled from 'styled-components/native'

export const ThreadContent = styled(Text.Body)`
  font-size: 15px;
  padding-bottom: 12px;
  color: #000000;
`

export const ThreadContainer = styled.TouchableOpacity`
  background-color: #ffffff;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f3f4f6;
  active-opacity: 0.7;
`

export const QuotedThread = styled.TouchableOpacity`
  border-left-width: 3px;
  border-left-color: #e5e7eb;
  padding-left: 12px;
`

export const RepostNote = styled(Text.Body)`
  font-size: 13px;
  padding-bottom: 4px;
  color: #9ca3af;
`

export const HiddenNote = styled(Text.Body)`
  font-size: 14px;
  padding-bottom: 8px;
  color: #6b7280;
`

// A link-like toggle rather than a filled button: it sits inside the card's own
// TouchableOpacity, which opens the post, so it must not read as the card's
// main action.
export const RevealToggle = styled.TouchableOpacity`
  align-self: flex-start;
  padding-bottom: 12px;
`

export const RevealToggleText = styled(Text.Body)`
  font-size: 13px;
  font-weight: 600;
  color: #16a34a;
`

export const ThreadHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`

export const ThreadTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  flex: 1;
  margin-right: 15px;
`

export const UserInfo = styled.View`
  flex: 1;
`
