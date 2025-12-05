import { Text } from '@berty/gnonative-ui'
import styled from 'styled-components/native'

export const ThreadContent = styled(Text.Body)`
  font-size: 15px;
  padding-bottom: 12px;
  color: #6b7280;
`

export const ThreadContainer = styled.TouchableOpacity`
  background-color: #ffffff;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f3f4f6;
  active-opacity: 0.7;
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
