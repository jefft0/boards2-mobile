import { Text } from '@berty/gnonative-ui'
import styled from 'styled-components/native'

export const ThreadContent = styled(Text.Body)`
  font-size: 15px;
  padding-bottom: 12px;
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
  margin-bottom: 12px;
`

export const UserInfo = styled.View`
  flex: 1;
`
