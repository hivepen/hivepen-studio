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

const buttonRecipe = defineRecipe({
  variants: {
    size: {
      sm: {
        h: '8',
        minW: '8',
        px: '3',
        textStyle: 'sm',
        gap: '2',
        _icon: {
          width: '4',
          height: '4',
        },
      },
      md: {
        h: '9',
        minW: '9',
        px: '3.5',
        textStyle: 'sm',
        gap: '2',
        _icon: {
          width: '4.5',
          height: '4.5',
        },
      },
    },
  },
  defaultVariants: {
    size: 'sm',
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
      button: buttonRecipe,
    },
  },
}

export const system = createSystem(defaultConfig, config)
