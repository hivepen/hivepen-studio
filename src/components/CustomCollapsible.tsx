import { Collapsible, Flex, Text } from '@chakra-ui/react'
import { ChevronRight } from 'lucide-react'
import { ReactNode } from 'react'

export default function CustomCollapsible({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <Collapsible.Root defaultOpen={defaultOpen}>
      <Collapsible.Trigger
        paddingY="2"
        display="flex"
        alignItems="center"
        gap="2"
        color="fg.muted"
        fontSize="sm"
        fontWeight="600"
      >
        <Collapsible.Indicator
          transition="transform 0.2s"
          _open={{ transform: 'rotate(90deg)' }}
        >
          <ChevronRight size={16} />
        </Collapsible.Indicator>
        <Text>{title}</Text>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Flex direction="column" gap={3} pt={2}>
          {children}
        </Flex>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
