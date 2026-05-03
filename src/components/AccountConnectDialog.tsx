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
import { Tooltip } from './ui/tooltip'
import HiveKeychainIcon from './hive/HiveKeychainIcon'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import { m } from '@/paraglide/messages'

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
    <Dialog.Root
      open={open}
      onOpenChange={(details) => !details.open && onClose()}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content bg="bg.panel" borderColor="border">
          <Dialog.Header>
            <Dialog.Title>{m.account_connect_title()}</Dialog.Title>
            <Spacer />
            <CloseButton onClick={onClose} disabled={isConnecting} />
          </Dialog.Header>
          <Dialog.Body>
            <Stack gap={4}>
              <Text color="fg.muted" fontSize="sm">
                {m.account_connect_description()}
              </Text>
              <Field.Root>
                <Field.Label>{m.account_connect_username_label()}</Field.Label>

                <InputGroup
                  startAddon={
                    username && (
                      <Box>
                        {' '}
                        <Avatar
                          size="xs"
                          fallback="?"
                          src={getHiveAvatarUrl(username)}
                        />
                      </Box>
                    )
                  }
                >
                  <Input
                    placeholder={m.account_connect_username_placeholder()}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </InputGroup>
              </Field.Root>
              {!keychainAvailable && (
                <Alert status="warning" colorPalette={'yellow'}>
                  {m.account_connect_keychain_missing()}
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
                      {m.account_connect_tooltip()}{' '}
                      <HiveKeychainIcon size="xs" />
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
                      {m.account_connect_button()}
                    </Button>
                  </Show>
                </Tooltip>
              </HStack>

              <Show when={!keychainAvailable}>
                <Alert
                  title={<Text>{m.account_connect_missing_title()}</Text>}
                  status="warning"
                  colorPalette={'yellow'}
                >
                  {m.account_connect_missing_prefix()}{' '}
                  <Link
                    textDecoration="underline"
                    target="_blank"
                    href="https://hive-keychain.com/#download"
                  >
                    {m.account_connect_missing_install_link()}
                  </Link>{' '}
                  {m.account_connect_missing_middle()}{' '}
                  <Link
                    textDecoration="underline"
                    target="_blank"
                    href="https://hive-keychain.com/#download"
                  >
                    {m.account_connect_missing_mobile_link()}
                  </Link>{' '}
                  {m.account_connect_missing_suffix()}
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
