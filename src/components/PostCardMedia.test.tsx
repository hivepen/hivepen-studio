// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { describe, expect, it } from 'vitest'
import { PostCardMedia } from './PostCard'
import chakraSystem from '@/theme'

describe('PostCardMedia', () => {
  it('uses the prepared short title for placeholder text and image alt', () => {
    const { rerender } = render(
      <ChakraProvider value={chakraSystem}>
        <PostCardMedia author="alice" shortTitle="Hive onboarding" />
      </ChakraProvider>,
    )

    expect(screen.getByText('Hive onboarding')).toBeTruthy()

    rerender(
      <ChakraProvider value={chakraSystem}>
        <PostCardMedia
          author="alice"
          coverUrl="https://example.com/cover.png"
          shortTitle="Hive onboarding"
        />
      </ChakraProvider>,
    )

    expect(screen.getByAltText('Hive onboarding')).toBeTruthy()
  })
})
