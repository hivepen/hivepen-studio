import {
  HStack,
  IconButton,
  Input,
  InputGroup,
  Spinner,
} from '@chakra-ui/react'
import { Search } from 'lucide-react'

type SearchPanelProps = {
  placeholder: string
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  searchAriaLabel: string
  isLoading?: boolean
  isDisabled?: boolean
}

const SearchPanel = ({
  placeholder,
  value,
  onChange,
  onSearch,
  searchAriaLabel,
  isLoading,
  isDisabled,
}: SearchPanelProps) => {
  return (
    <HStack
      as="form"
      onSubmit={(event) => {
        event.preventDefault()
        if (!isDisabled) onSearch()
      }}
      gap={2}
      w="full"
    >
      <InputGroup
        endElement={isLoading ? <Spinner size="sm" color="fg.muted" /> : null}
        flex="1"
      >
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          bg="bg.panel"
          borderColor="border"
          borderRadius="full"
          px={4}
          h={11}
        />
      </InputGroup>
      <IconButton
        type="submit"
        aria-label={searchAriaLabel}
        colorPalette="gray"
        borderRadius="full"
        disabled={isDisabled}
        flexShrink={0}
      >
        <Search size={18} />
      </IconButton>
    </HStack>
  )
}

export default SearchPanel
