import { Box, Center, Flex, HStack, JsxStyleProps, Text } from '@chakra-ui/react'
import { Edit2Icon, EditIcon, SparkleIcon } from 'lucide-react'

export default function AppHeader({
  title,
  subtitle,
  children,
  leading,
  ...props
}: {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  children?: React.ReactNode,
  leading?: React.ReactNode,
} & JsxStyleProps) {
  return (
    <Box
      position="sticky"
      top={0}
      zIndex={5}
      px={{ base: 4, md: 6 }}
      py={6}
      backdropFilter="blur(8px)"
      {...props}
    >
      <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
        <HStack gap={3} minW={0}>
          {leading ?? 
          <Center
          h="36px"
          w="36px"
          color="whiteAlpha.900"
          p={2}
          borderRadius="xl"
          bgGradient="to-tr"
          gradientFrom="blackAlpha.100"
          gradientTo="transparent"
          >
            <SparkleIcon/>
          </Center>
          }
          <Box minW={0}>
            {subtitle && (
              <Text
                fontSize="xs"
                letterSpacing="0.2em"
                textTransform="uppercase"
                color="fg.muted"
              >
                {subtitle}
              </Text>
            )}
            <Box minW={0}>{title}</Box>
          </Box>
        </HStack>
        <HStack gap={2}>{children}</HStack>
      </Flex>
    </Box>
  )
}
