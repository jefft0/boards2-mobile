import React, { useState } from 'react'
import { View, Switch } from 'react-native'
import styled from 'styled-components/native'
import { Button, Text as GnoText } from '@berty/gnonative-ui'
import { BoardCreationData } from '@gno/redux'

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

const ToggleContainer = styled.View`
  background-color: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  border-width: 1px;
  border-color: #e5e7eb;
  margin-bottom: 24px;
`

const ToggleRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
`

const ToggleContent = styled.View`
  flex: 1;
  padding-right: 16px;
`

const ToggleTitle = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
`

const ToggleDescription = styled.Text`
  font-size: 12px;
  color: #6b7280;
  line-height: 18px;
`

const ButtonContainer = styled.View`
  gap: 12px;
  margin-top: 8px;
`

const Footer = styled.View`
  padding: 16px 16px 24px;
  align-items: center;
`

const FooterText = styled.Text`
  font-size: 12px;
  color: #9ca3af;
`

interface CreateBoardFormProps {
  onCreate: (board: BoardCreationData) => void
  onCancel?: () => void
  loading?: boolean
}

export default function CreateBoardForm({ onCreate, onCancel, loading }: CreateBoardFormProps) {
  const [boardName, setBoardName] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  const handleCreate = () => {
    if (boardName.trim()) {
      onCreate({ boardName, isPublic })
    }
  }

  return (
    <>
      <Container>
        <FormGroup>
          <GnoText.Label>Board Name *</GnoText.Label>
          <Input
            value={boardName}
            onChangeText={setBoardName}
            placeholder="Enter board name"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
          />
          <HelperText>Choose a descriptive name for your board</HelperText>
        </FormGroup>

        <ToggleContainer>
          <ToggleRow>
            <ToggleContent>
              <ToggleTitle>Public Board</ToggleTitle>
              <ToggleDescription>
                {isPublic
                  ? 'This board will be visible to all users'
                  : 'This board will be private and hidden from public listings'}
              </ToggleDescription>
            </ToggleContent>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: '#d1d5db', true: '#86efac' }}
              thumbColor={isPublic ? '#15803d' : '#f3f4f6'}
              ios_backgroundColor="#d1d5db"
            />
          </ToggleRow>
        </ToggleContainer>

        {/* Info Box */}
        {/* <InfoBox>
          <InfoIconContainer>
            <Text style={{ fontSize: 20 }}>ℹ️</Text>
          </InfoIconContainer>
          <InfoText>Once created, you'll be the board administrator and can manage threads, users, and settings.</InfoText>
        </InfoBox> */}
        <View style={{ flexGrow: 1 }} />

        <ButtonContainer>
          <Button onPress={handleCreate} disabled={!boardName.trim() || loading} color="tertirary" activeOpacity={0.8}>
            {loading ? 'Creating...' : 'Create Board'}
          </Button>
          <Button onPress={onCancel} color="secondary" activeOpacity={0.8}>
            Cancel
          </Button>
        </ButtonContainer>
      </Container>

      <Footer>
        <FooterText>Powered by GnoNative v1.0.0</FooterText>
      </Footer>
    </>
  )
}
