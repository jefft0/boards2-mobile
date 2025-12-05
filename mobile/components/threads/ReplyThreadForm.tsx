import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
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

export interface CreateReplyThreadFormData {
  replyBody: string
}

interface Props {
  onCreate: (form: CreateReplyThreadFormData) => void
  onCancel: () => void
  loading: boolean
}

export default function ReplyThreadForm({ onCreate, onCancel, loading }: Props) {
  const [replyBody, setReplyBody] = useState('')

  const handleCreate = () => {
    if (replyBody.trim()) {
      onCreate({ replyBody } as CreateReplyThreadFormData)
    }
  }

  return (
    <>
      <Container>
        <FormGroup>
          <GnoText.Label>Reply Body</GnoText.Label>
          <Input
            value={replyBody}
            onChangeText={setReplyBody}
            placeholder="Enter your reply"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            style={styles.textArea}
          />
          <HelperText>Write your reply to this thread</HelperText>
        </FormGroup>

        <View style={{ flexGrow: 1 }} />
        <ButtonContainer>
          <Button onPress={handleCreate} disabled={!replyBody.trim() || loading} color="tertirary" activeOpacity={0.8}>
            {loading ? 'Loading' : 'Reply'}
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

const styles = StyleSheet.create({
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 200,
    backgroundColor: '#fff'
  }
})
