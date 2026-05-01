import { Box, HStack, Image, Text } from '@chakra-ui/react'
import { useState } from 'react'

const HIVE_ICON_URL = 'https://www.hive.io/images/circle_hive_red.png'
const HBD_ICON_URL = 'https://www.hive.io/images/hbd.svg'
const HIVE_ENGINE_ICON_URL = 'https://hive-engine.com/images/favicon.svg'
const TRIBALDEX_TOKEN_ICON_BASE =
  'https://cdn.tribaldex.com/tribaldex/token-icons'

export type WalletColorPalette =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'cyan'
  | 'purple'
  | 'pink'

export type WalletAssetMeta = {
  colorPalette: WalletColorPalette
  iconUrl?: string
  label: string
  symbol: string
}

const paletteSequence: Array<WalletColorPalette> = [
  'red',
  'green',
  'blue',
  'orange',
  'purple',
  'cyan',
  'pink',
  'teal',
  'yellow',
]

const specialAssets = {
  ENGINE: {
    colorPalette: 'orange',
    iconUrl: HIVE_ENGINE_ICON_URL,
    label: 'Hive Engine',
    symbol: 'ENGINE',
  },
  HBD: {
    colorPalette: 'green',
    iconUrl: HBD_ICON_URL,
    label: 'HBD',
    symbol: 'HBD',
  },
  HIVE: {
    colorPalette: 'red',
    iconUrl: HIVE_ICON_URL,
    label: 'HIVE',
    symbol: 'HIVE',
  },
  HP: {
    colorPalette: 'purple',
    iconUrl: HIVE_ICON_URL,
    label: 'Hive Power',
    symbol: 'HP',
  },
  RC: {
    colorPalette: 'blue',
    label: 'Resource credits',
    symbol: 'RC',
  },
} satisfies Record<string, WalletAssetMeta>

const trimSwapPrefix = (symbol: string) => symbol.replace(/^SWAP\./, '')

const getSymbolPalette = (symbol: string): WalletColorPalette => {
  const seed = [...symbol].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return paletteSequence[seed % paletteSequence.length]
}

export const getWalletAssetMeta = (rawSymbol: string): WalletAssetMeta => {
  const normalized = rawSymbol.trim().toUpperCase()

  if (normalized === 'SWAP.HIVE') {
    return {
      ...specialAssets.HIVE,
      label: normalized,
      symbol: normalized,
    }
  }

  if (normalized === 'SWAP.HBD') {
    return {
      ...specialAssets.HBD,
      label: normalized,
      symbol: normalized,
    }
  }

  if (Object.prototype.hasOwnProperty.call(specialAssets, normalized)) {
    return specialAssets[normalized as keyof typeof specialAssets]
  }

  return {
    colorPalette: getSymbolPalette(trimSwapPrefix(normalized)),
    iconUrl: `${TRIBALDEX_TOKEN_ICON_BASE}/${normalized}.png`,
    label: normalized,
    symbol: normalized,
  }
}

function AssetImage({
  alt,
  fallback,
  src,
}: {
  alt: string
  fallback: string
  src?: string
}) {
  const [broken, setBroken] = useState(false)

  if (!src || broken) {
    return (
      <Text
        color="colorPalette.fg"
        fontSize="xs"
        fontWeight="700"
        lineClamp={1}
        textTransform="uppercase"
      >
        {fallback}
      </Text>
    )
  }

  return (
    <Image
      alt={alt}
      boxSize="full"
      objectFit="contain"
      onError={() => setBroken(true)}
      src={src}
    />
  )
}

export function WalletAssetIcon({
  symbol,
  size = '9',
}: {
  size?: string
  symbol: string
}) {
  const asset = getWalletAssetMeta(symbol)

  return (
    <Box
      alignItems="center"
      bg="colorPalette.subtle"
      border="1px solid"
      borderColor="colorPalette.muted"
      borderRadius="full"
      boxSize={size}
      colorPalette={asset.colorPalette}
      display="inline-flex"
      flexShrink={0}
      justifyContent="center"
      overflow="hidden"
      p="1.5"
    >
      <AssetImage
        alt={`${asset.label} icon`}
        fallback={asset.symbol.replace(/^SWAP\./, '').slice(0, 3)}
        src={asset.iconUrl}
      />
    </Box>
  )
}

export function WalletAssetBadge({
  detail,
  label,
  symbol,
}: {
  detail?: string
  label?: string
  symbol: string
}) {
  const asset = getWalletAssetMeta(symbol)

  return (
    <HStack colorPalette={asset.colorPalette} gap={3} minW={0}>
      <WalletAssetIcon symbol={symbol} />
      <Box minW={0}>
        <Text color="fg" fontWeight="600" lineClamp={1}>
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
