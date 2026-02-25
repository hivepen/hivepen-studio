import {
  AlertDescription,
  AlertRoot,
  AlertTitle,
  Box,
  Button,
  Dialog,
  Field,
  HStack,
  Icon,
  Image,
  Input,
  InputGroup,
  Link,
  Show,
  Spacer,
  Stack,
  Text,
  type IconProps,
} from '@chakra-ui/react'
import { useState } from 'react'
import { Alert } from './ui/alert'
import { KeyRoundIcon } from 'lucide-react'
import { Avatar } from './ui/avatar'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import { Tooltip } from './ui/tooltip'

export const HIVE_KEYCHAIN_ICON_URL = 'https://hive-keychain.com/favicon.png'

type HiveKeychainIconProps = Omit<IconProps, 'children'> & {
  size?: IconProps['size']
}

function HiveKeychainIcon({ size = 'md', ...props }: HiveKeychainIconProps) {
  return (
    <Icon size={size} {...props}>
      <Image src={HIVE_KEYCHAIN_ICON_URL} alt="Hive Keychain" />
    </Icon>
  )
}

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
                <Button variant="outline" onClick={onClose} disabled={isConnecting}>
                  Cancel
                </Button>
                <Spacer />
                <Tooltip
                  content={
                    <Text>
                      Connect using HiveKeychain <HiveKeychainIcon size="xs" />
                    </Text>
                  }
                >
                  <Button
                    colorPalette="orange"
                    onClick={() => onConnect(username)}
                    loading={isConnecting}
                    disabled={!keychainAvailable || !username.trim()}
                  >
                    <HiveKeychainIcon />
                    Connect
                  </Button>
              </Tooltip>
              </HStack>

            <Show when={!window.hive_keychain}>
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
