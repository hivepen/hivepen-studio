import {
  Box,
  Button,
  HStack,
  Image,
  Link,
  Show,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import type { PendingHiveAuthRequest } from '@/lib/hive/walletAuth'
import { Alert } from '@/components/ui/alert'
import { m } from '@/paraglide/messages'

export default function HiveAuthPendingRequest({
  request,
}: {
  request: PendingHiveAuthRequest
}) {
  const [copyState, setCopyState] = useState<'copied' | 'idle'>('idle')
  const [isAndroid, setIsAndroid] = useState(false)

  useEffect(() => {
    setIsAndroid(
      typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent),
    )
  }, [])

  useEffect(() => {
    setCopyState('idle')
  }, [request.deeplink, request.requestId])

  const handleCopyDeepLink = async () => {
    try {
      await navigator.clipboard.writeText(request.deeplink)
      setCopyState('copied')
    } catch {
      window.alert(m.account_connect_copy_error())
    }
  }

  return (
    <Alert
      status="info"
      colorPalette="blue"
      title={m.account_connect_pending_title()}
    >
      <Stack gap={3} align="start">
        <Text fontSize="sm">{m.account_connect_pending_description()}</Text>

        <HStack gap={2} wrap="wrap">
          <Button size="sm" colorPalette="blue" asChild>
            <a href={request.deeplink}>
              {m.account_connect_open_wallet_button()}
            </a>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleCopyDeepLink()}
          >
            {copyState === 'copied'
              ? m.account_connect_copied_button()
              : m.account_connect_copy_button()}
          </Button>
        </HStack>

        <Show when={isAndroid}>
          <Stack gap={2} align="start">
            <Text fontSize="xs" color="colorPalette.fg">
              {m.account_connect_android_hint()}
            </Text>
            <HStack gap={2} wrap="wrap">
              <Button size="sm" variant="outline" asChild>
                <a href={request.androidIntentLinks.hiveAuth}>
                  {m.account_connect_open_hiveauth_button()}
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={request.androidIntentLinks.keychain}>
                  {m.account_connect_open_keychain_button()}
                </a>
              </Button>
            </HStack>
          </Stack>
        </Show>

        {request.qrCodeDataUrl ? (
          <Box
            p={3}
            borderWidth="1px"
            borderColor="colorPalette.border"
            borderRadius="lg"
            bg="white"
          >
            <Image
              src={request.qrCodeDataUrl}
              alt="HiveAuth QR code"
              boxSize="220px"
            />
          </Box>
        ) : null}

        {request.qrCodeDataUrl ? (
          <Text fontSize="xs" color="colorPalette.fg">
            {m.account_connect_scan_hint()}
          </Text>
        ) : null}

        <Text fontSize="xs" color="fg.muted">
          {m.account_connect_pending_hint()}{' '}
          <Link href={request.deeplink} textDecoration="underline">
            {m.account_connect_open_wallet_button()}
          </Link>
          .
        </Text>
      </Stack>
    </Alert>
  )
}
