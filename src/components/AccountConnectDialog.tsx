import {
  Button,
  Dialog,
  Field,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useState } from 'react'
import { Alert } from './ui/alert'

export default function AccountConnectDialog({
  open,
  onClose,
  onConnect,
  isConnecting,
  keychainAvailable,
}: {
  open: boolean
  onClose: () => void
  onConnect: (username: string) => void
  isConnecting: boolean
  keychainAvailable: boolean
}) {
  const [username, setUsername] = useState('')

  return (
    <Dialog.Root open={open} onOpenChange={(details) => !details.open && onClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content bg="bg.panel" borderColor="border">
          <Dialog.Header>
            <Dialog.Title>Connect Hive account</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <Stack gap={4}>
              <Text color="fg.muted" fontSize="sm">
                Sign in with Hive Keychain to enable publishing and commenting.
              </Text>
              <Field.Root>
                <Field.Label>Hive username</Field.Label>
                <Input
                  placeholder="e.g. alice"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  bg="bg.muted"
                  borderColor="border"
                />
              </Field.Root>
              {!keychainAvailable && (
                <Alert status="warning" colorPalette={"yellow"}>
                  Hive Keychain was not detected. Install the extension to
                  continue.
                </Alert>
              )}
            </Stack>
          </Dialog.Body>
          <Dialog.Footer gap={2}>
            <Button variant="outline" onClick={onClose} disabled={isConnecting}>
              Cancel
            </Button>
            <Button
              colorPalette="gray"
              onClick={() => onConnect(username)}
              loading={isConnecting}
              disabled={!keychainAvailable || !username.trim()}
            >
              Connect
            </Button>
          </Dialog.Footer>
          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
