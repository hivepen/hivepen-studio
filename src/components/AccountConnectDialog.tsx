import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Field,
  HStack,
  Input,
  InputGroup,
  Link,
  Show,
  Spacer,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useState } from 'react'
import { Alert } from './ui/alert'
import { Avatar } from './ui/avatar'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import { Tooltip } from './ui/tooltip'
import HiveKeychainIcon from './hive/HiveKeychainIcon'



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
            <Spacer/>
            <CloseButton onClick={onClose} disabled={isConnecting} />
          </Dialog.Header>
          <Dialog.Body>
            <Stack gap={4}>
              <Text color="fg.muted" fontSize="sm">
                Sign in with Hive Keychain to enable publishing and commenting.
              </Text>
              <Field.Root>
                <Field.Label>Hive username</Field.Label>

                <InputGroup startAddon={username && <Box> <Avatar size="xs" fallback="?" src={getHiveAvatarUrl(username)} /></Box>}>
                  <Input
                    placeholder="e.g. alice"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}

                  />
                </InputGroup>

              </Field.Root>
              {!keychainAvailable && (
                <Alert status="warning" colorPalette={"yellow"}>
                  Hive Keychain was not detected. Install the extension to
                  continue.
                </Alert>
              )}
            </Stack>
          </Dialog.Body>
          <Dialog.Footer gap={2} asChild>
            <Stack>
              <HStack w="full">
                {/* <Button variant="outline" onClick={onClose} disabled={isConnecting}>
                  Cancel
                </Button> */}
                <Spacer />
                <Tooltip
                  content={
                    <Text>
                      Connect using HiveKeychain <HiveKeychainIcon size="xs" />
                    </Text>
                  }
                >
                  <Show when={keychainAvailable}>
                    <Button
                      colorPalette="gray"
                      size="md"
                      variant="surface"
                      onClick={() => onConnect(username)}
                      loading={isConnecting}
                      disabled={!keychainAvailable || !username.trim()}
                    >
                      <HiveKeychainIcon />
                      Connect
                    </Button>
                  </Show>
              </Tooltip>
              </HStack>

            <Show when={!keychainAvailable}>
              <Alert title={<Text>
                HiveKeychain not detected
              </Text>} status="warning" colorPalette={"yellow"}>
                <Link textDecoration="underline" target='_blank' href="https://hive-keychain.com/#download">Install the Hive Keychain extension</Link> to connect your Hive account. Or open this app in the <Link textDecoration="underline" target='_blank' href='https://hive-keychain.com/#download'>HiveKeychain mobile app</Link> internal browser.
              </Alert>
            </Show>
            </Stack>
          </Dialog.Footer>
          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
