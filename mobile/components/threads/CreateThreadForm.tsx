import React, { useState } from 'react'
import { View } from 'react-native'
import styled from 'styled-components/native'
import { Button, Text as GnoText } from '@berty/gnonative-ui'

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

export interface CreateThreadFormData {
  threadName: string
  threadBody: string
}

interface Props {
  onCreate: (form: CreateThreadFormData) => void
  onCancel: () => void
  loading: boolean
}

export default function CreateThreadForm({ onCreate, onCancel, loading }: Props) {
  const [threadName, setBoardName] = useState('')
  const [threadBody, setThreadBody] = useState('')

  const handleCreate = () => {
    if (threadName.trim()) {
      onCreate({ threadName, threadBody } as CreateThreadFormData)
    }
  }

  return (
    <>
      <Container>
        <FormGroup>
          <GnoText.Label>Thread Name *</GnoText.Label>
          <Input
            value={threadName}
            onChangeText={setBoardName}
            placeholder="Enter board name"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
          />
          <HelperText>Choose a descriptive name for your thread</HelperText>
        </FormGroup>

        <FormGroup>
          <GnoText.Label>Thread Body</GnoText.Label>
          <Input
            value={threadBody}
            onChangeText={setThreadBody}
            placeholder="Enter thread content"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={{ minHeight: 120 }}
          />
          <HelperText>Write the main content of your thread</HelperText>
        </FormGroup>

        {/* Info Box */}
        {/* <InfoBox>
          <InfoIconContainer>
            <Text style={{ fontSize: 20 }}>ℹ️</Text>
          </InfoIconContainer>
          <InfoText>Once created, you'll be the board administrator and can manage threads, users, and settings.</InfoText>
        </InfoBox> */}
        <View style={{ flexGrow: 1 }} />

        <ButtonContainer>
          <Button onPress={handleCreate} disabled={!threadName.trim() || loading} color="tertirary" activeOpacity={0.8}>
            {loading ? 'Loading' : 'Create Thread'}
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
