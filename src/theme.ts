import {
  createSystem,
  defaultConfig,
  defineRecipe,
  defineTokens,
  defineTextStyles,
} from '@chakra-ui/react'

const fonts = defineTokens.fonts({
  heading: { value: 'Poppins, "Segoe UI", "Helvetica Neue", sans-serif' },
  body: {
    value: 'Poppins, "Segoe UI", "Helvetica Neue", sans-serif',
  },
  mono: {
    value:
      'Menlo, Consolas, "Liberation Mono", "Courier New", monospace',
  },
})

const commonBaseRecipe = defineRecipe({
  base: {
    borderRadius: "lg",
  },
})

const textStyles = defineTextStyles({
  postBody: {
    value: {
      fontSize: 'md',
      lineHeight: 'tall',
    },
  },
  commentBody: {
    value: {
      fontSize: 'sm',
      lineHeight: 'tall',
    },
  },
})

const config = {
  theme: {
    tokens: {
      fonts,
    },
    textStyles,
    recipes: {
      button: commonBaseRecipe,
      card: commonBaseRecipe,
    },
  },
}

export const chakraSystem = createSystem(defaultConfig, config)
export default chakraSystem