import { Text } from '@berty/gnonative-ui'
import styled from 'styled-components/native'

const Meta = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`

const MetaItem = styled.View`
  flex-direction: row;
  align-items: center;
  margin-right: 16px;
`

const MetaIcon = styled.Text`
  font-size: 14px;
  margin-right: 4px;
`

const Footer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

const Spacer = () => {
  return (
    <Text.Body
      color="#ccc"
      style={{
        marginHorizontal: 2
      }}
    >
      •
    </Text.Body>
  )
}

const MetaValue = styled(Text.Caption)`
  color: ${(props) => props.color || props.theme.text.textMuted};
`

const CardFooter = { MetaValue, Meta, MetaItem, MetaIcon, Footer, Spacer }

export default CardFooter
