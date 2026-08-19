import React, { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import styled from 'styled-components/native'
import { Button, Text as GnoText } from '@berty/gnonative-ui'
import { useGnoNativeContext } from '@gnolang/gnonative'
import { maybeFetchBoardName } from '@gno/redux'

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

export interface CreateRepostThreadFormData {
  destinationBoardId: string
  repostTitle: string
  repostBody: string
}

// Shown until the typed ID resolves to a board.
const DEFAULT_BOARD_HELPER_TEXT = 'Enter the board ID'

// Long enough that a burst of keystrokes makes a single GetBoard query.
const BOARD_LOOKUP_DEBOUNCE_MS = 400

interface Props {
  onCreate: (form: CreateRepostThreadFormData) => void
  onCancel: () => void
  loading: boolean
  /** Title of the thread being reposted. Seeds the title field, as gnoweb does. */
  initialTitle?: string
}

export default function RepostThreadForm({ onCreate, onCancel, loading, initialTitle = '' }: Props) {
  const [destinationBoardId, setDestinationBoardId] = useState('')
  const [destinationBoardName, setDestinationBoardName] = useState<string | undefined>(undefined)
  const [repostTitle, setRepostTitle] = useState(initialTitle)
  const [repostBody, setRepostBody] = useState('')

  const { gnonative } = useGnoNativeContext()

  const boardIdIsValid = /^\d+$/.test(destinationBoardId.trim())

  // Name the board while the ID is being typed. `cancelled` drops the answer of a
  // query the user has already typed past, so a slow reply can't overwrite a newer one.
  useEffect(() => {
    if (!boardIdIsValid) {
      setDestinationBoardName(undefined)
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      const name = await maybeFetchBoardName(gnonative, Number(destinationBoardId.trim()))
      if (!cancelled) setDestinationBoardName(name)
    }, BOARD_LOOKUP_DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationBoardId, boardIdIsValid])

  const handleCreate = () => {
    if (repostBody.trim() && boardIdIsValid) {
      onCreate({ destinationBoardId: destinationBoardId.trim(), repostTitle, repostBody } as CreateRepostThreadFormData)
    }
  }

  return (
    <>
      <Container>
        <FormGroup>
          <GnoText.Label>Board ID where to repost</GnoText.Label>
          <Input
            value={destinationBoardId}
            onChangeText={setDestinationBoardId}
            placeholder="Board ID"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
          />
          <HelperText>{destinationBoardName ? `Repost to: ${destinationBoardName}` : DEFAULT_BOARD_HELPER_TEXT}</HelperText>
        </FormGroup>

        <FormGroup>
          <GnoText.Label>Repost Thread Title</GnoText.Label>
          <Input
            value={repostTitle}
            onChangeText={setRepostTitle}
            placeholder="Enter repost thread title"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
          />
          <HelperText>Choose a descriptive title for your repost</HelperText>
        </FormGroup>

        <FormGroup>
          <GnoText.Label>Repost Thread Content</GnoText.Label>
          <Input
            value={repostBody}
            onChangeText={setRepostBody}
            placeholder="Enter repost thread content"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            style={styles.textArea}
          />
          <HelperText>Write the content of your repost message</HelperText>
        </FormGroup>

        <View style={{ flexGrow: 1 }} />
        <ButtonContainer>
          <Button
            onPress={handleCreate}
            disabled={!repostBody.trim() || !boardIdIsValid || loading}
            color="tertirary"
            activeOpacity={0.8}
          >
            {loading ? 'Loading' : 'Repost'}
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
