import { Box, Button, HStack, Input, Stack, Text } from '@chakra-ui/react'
import { Field } from '@/components/ui/field'

type SearchPanelProps = {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  buttonLabel: string
  helperText?: string
  isLoading?: boolean
  isDisabled?: boolean
}

const SearchPanel = ({
  label,
  placeholder,
  value,
  onChange,
  onSearch,
  buttonLabel,
  helperText,
  isLoading,
  isDisabled,
}: SearchPanelProps) => {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="16px"
      bg="bg.panel"
      p={{ base: 4, md: 6 }}
    >
      <Stack gap={4}>
        <Field label={label}>
          <Input
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            bg="bg.panel"
            borderColor="border"
          />
        </Field>
        <HStack justify="space-between" wrap="wrap" gap={3}>
          <Button
            colorPalette="gray"
            onClick={onSearch}
            loading={isLoading}
            disabled={isDisabled}
          >
            {buttonLabel}
          </Button>
          {helperText ? (
            <Text fontSize="sm" color="fg.muted">
              {helperText}
            </Text>
          ) : null}
        </HStack>
      </Stack>
    </Box>
  )
}

export default SearchPanel
