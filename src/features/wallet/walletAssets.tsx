import { Box, HStack, Image, Text } from '@chakra-ui/react'
import { useState } from 'react'

const HIVE_ICON_URL = 'https://www.hive.io/images/circle_hive_red.png'
const HBD_ICON_URL = 'https://www.hive.io/images/hbd.svg'
const HIVE_ENGINE_ICON_URL = 'https://hive-engine.com/images/favicon.svg'
const TRIBALDEX_TOKEN_ICON_BASE =
  'https://cdn.tribaldex.com/tribaldex/token-icons'

export type WalletAssetTone = {
  bg: string
  fg: string
  ring: string
  soft: string
}

export type WalletAssetMeta = {
  symbol: string
  label: string
  iconUrl?: string
  tone: WalletAssetTone
}

const toneSequence: Array<WalletAssetTone> = [
  {
    bg: '#FFF1F3',
    fg: '#9F1239',
    ring: '#E31337',
    soft: '#FFD6DD',
  },
  {
    bg: '#ECFDF3',
    fg: '#166534',
    ring: '#00960E',
    soft: '#BBF7D0',
  },
  {
    bg: '#EEF4FF',
    fg: '#1D4ED8',
    ring: '#3B82F6',
    soft: '#BFDBFE',
  },
  {
    bg: '#FFF7ED',
    fg: '#C2410C',
    ring: '#F97316',
    soft: '#FED7AA',
  },
  {
    bg: '#FAF5FF',
    fg: '#7C3AED',
    ring: '#8B5CF6',
    soft: '#DDD6FE',
  },
  {
    bg: '#ECFEFF',
    fg: '#0F766E',
    ring: '#14B8A6',
    soft: '#A5F3FC',
  },
]

const specialAssets = {
  HIVE: {
    symbol: 'HIVE',
    label: 'HIVE',
    iconUrl: HIVE_ICON_URL,
    tone: toneSequence[0],
  },
  HP: {
    symbol: 'HP',
    label: 'Hive Power',
    iconUrl: HIVE_ICON_URL,
    tone: {
      bg: '#F5F3FF',
      fg: '#6D28D9',
      ring: '#7C3AED',
      soft: '#DDD6FE',
    },
  },
  HBD: {
    symbol: 'HBD',
    label: 'HBD',
    iconUrl: HBD_ICON_URL,
    tone: toneSequence[1],
  },
  RC: {
    symbol: 'RC',
    label: 'Resource credits',
    tone: toneSequence[2],
  },
  ENGINE: {
    symbol: 'ENGINE',
    label: 'Hive Engine',
    iconUrl: HIVE_ENGINE_ICON_URL,
    tone: toneSequence[3],
  },
} satisfies Record<string, WalletAssetMeta>

const trimSwapPrefix = (symbol: string) => symbol.replace(/^SWAP\./, '')

const getSymbolTone = (symbol: string): WalletAssetTone => {
  const seed = [...symbol].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return toneSequence[seed % toneSequence.length]
}

export const getWalletAssetMeta = (rawSymbol: string): WalletAssetMeta => {
  const normalized = rawSymbol.trim().toUpperCase()

  if (normalized === 'SWAP.HIVE') {
    return {
      ...specialAssets.HIVE,
      symbol: normalized,
      label: normalized,
    }
  }

  if (normalized === 'SWAP.HBD') {
    return {
      ...specialAssets.HBD,
      symbol: normalized,
      label: normalized,
    }
  }

  if (Object.prototype.hasOwnProperty.call(specialAssets, normalized)) {
    return specialAssets[normalized as keyof typeof specialAssets]
  }

  return {
    symbol: normalized,
    label: normalized,
    iconUrl: `${TRIBALDEX_TOKEN_ICON_BASE}/${normalized}.png`,
    tone: getSymbolTone(trimSwapPrefix(normalized)),
  }
}

function AssetImage({
  src,
  alt,
  fallback,
}: {
  src?: string
  alt: string
  fallback: string
}) {
  const [broken, setBroken] = useState(false)

  if (!src || broken) {
    return (
      <Text
        fontSize="xs"
        fontWeight="700"
        textTransform="uppercase"
        lineClamp={1}
      >
        {fallback}
      </Text>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      boxSize="full"
      objectFit="contain"
      onError={() => setBroken(true)}
    />
  )
}

export function WalletAssetIcon({
  symbol,
  size = '9',
}: {
  symbol: string
  size?: string
}) {
  const asset = getWalletAssetMeta(symbol)

  return (
    <Box
      boxSize={size}
      borderRadius="full"
      bg={asset.tone.bg}
      color={asset.tone.fg}
      border="1px solid"
      borderColor={asset.tone.soft}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      flexShrink={0}
      boxShadow={`inset 0 0 0 1px ${asset.tone.soft}`}
      p="1.5"
    >
      <AssetImage
        src={asset.iconUrl}
        alt={`${asset.label} icon`}
        fallback={asset.symbol.replace(/^SWAP\./, '').slice(0, 3)}
      />
    </Box>
  )
}

export function WalletAssetBadge({
  symbol,
  label,
  detail,
}: {
  symbol: string
  label?: string
  detail?: string
}) {
  const asset = getWalletAssetMeta(symbol)

  return (
    <HStack gap={3} minW={0}>
      <WalletAssetIcon symbol={symbol} />
      <Box minW={0}>
        <Text fontWeight="600" lineClamp={1}>
          {label ?? asset.label}
        </Text>
        {detail ? (
          <Text color="fg.muted" fontSize="xs" lineClamp={1}>
            {detail}
          </Text>
        ) : null}
      </Box>
    </HStack>
  )
}
