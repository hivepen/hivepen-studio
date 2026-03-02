import { createFileRoute } from '@tanstack/react-router'
import { Box, Heading, Text } from '@chakra-ui/react'
import { getAccountFullQueryOptions, ConfigManager } from '@ecency/sdk';
import { useQuery } from '@tanstack/react-query';
import DevOnly from '@/components/DevOnly';

export const Route = createFileRoute('/users')({
  component: Users,
})

function Users() {


// optionally provide a custom QueryClient
// ConfigManager.setQueryClient(myQueryClient);

const { data } = useQuery(getAccountFullQueryOptions('ecency'));
  return (
    <Box p={6}>
      <Heading size="lg" mb={2}>
        Users
      </Heading>
      <Text color="fg.muted">
        Discover notable Hive , track activity, and manage relationships.
      </Text>
    </Box>
  )
}
