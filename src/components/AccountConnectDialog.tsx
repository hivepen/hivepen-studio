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
  Spacer,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useState } from 'react'
import HiveAuthPendingRequest from './auth/HiveAuthPendingRequest'
import HiveKeychainIcon from './hive/HiveKeychainIcon'
import { Alert } from './ui/alert'
import { Avatar } from './ui/avatar'
import type {
  PendingHiveAuthRequest,
  WalletProvider,
} from '@/lib/hive/walletAuth'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import { m } from '@/paraglide/messages'

export default function AccountConnectDialog({
  open,
  onClose,
  onConnect,
  isConnecting,
  isHiveAuthAvailable,
  isHiveAuthLoading,
  keychainAvailable,
  pendingHiveAuthRequest,
  connectingProvider,
}: {
  open: boolean
  onClose: () => void
  onConnect: (provider: WalletProvider, username: string) => void
  isConnecting: boolean
  isHiveAuthAvailable: boolean
  isHiveAuthLoading: boolean
  keychainAvailable: boolean
  pendingHiveAuthRequest: PendingHiveAuthRequest | null
  connectingProvider: WalletProvider | null
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

              {pendingHiveAuthRequest ? (
                <HiveAuthPendingRequest request={pendingHiveAuthRequest} />
              ) : null}
            </Stack>
          </Dialog.Body>
          <Dialog.Footer gap={2} asChild>
            <Stack>
              <HStack w="full">
                <Spacer />
                <Button
                  colorPalette="gray"
                  size="md"
                  variant="surface"
                  onClick={() => onConnect('keychain', username)}
                  loading={connectingProvider === 'keychain' && isConnecting}
                  disabled={
                    !keychainAvailable || !username.trim() || isConnecting
                  }
                >
                  <HiveKeychainIcon />
                  {m.account_connect_keychain_button()}
                </Button>
                <Button
                  colorPalette="blue"
                  size="md"
                  variant="surface"
                  onClick={() => onConnect('hiveauth', username)}
                  loading={
                    connectingProvider === 'hiveauth' || isHiveAuthLoading
                  }
                  disabled={
                    !isHiveAuthAvailable || !username.trim() || isConnecting
                  }
                >
                  {m.account_connect_hiveauth_button()}
                </Button>
              </HStack>

              {!keychainAvailable ? (
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
              ) : null}
            </Stack>
          </Dialog.Footer>
          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
