// Locale switcher refs:
// - Paraglide docs: https://inlang.com/m/gerre34r/library-inlang-paraglideJs
// - Router example: https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#switching-locale
import { Select, createListCollection } from '@chakra-ui/react'
import { getLocale, locales, setLocale } from '@/paraglide/runtime'
import { m } from '@/paraglide/messages'

type AppLocale = (typeof locales)[number]

const resolveLocaleLabel = (locale: string) => {
  switch (locale) {
    case 'en':
      return m.language_option_en()
    case 'es':
      return m.language_option_es()
    case 'de':
      return m.language_option_de()
    case 'it':
      return m.language_option_it()
    case 'fr':
      return m.language_option_fr()
    case 'pt':
      return m.language_option_pt()
    case 'zh':
      return m.language_option_zh()
    default:
      return locale.toUpperCase()
  }
}

export default function ParaglideLocaleSwitcher() {
  const currentLocale = getLocale()
  const collection = createListCollection({
    items: locales.map((locale) => ({
      value: locale,
      label: resolveLocaleLabel(locale),
    })),
  })

  return (
    <Select.Root
      collection={collection}
      value={[currentLocale]}
      onValueChange={(details) => {
        const value = details.value[0]
        if (value && value !== currentLocale) {
          setLocale(value as AppLocale)
        }
      }}
      size="sm"
      maxW={'32'}
    >
      <Select.Control>
        <Select.Trigger bg="bg.panel" borderColor="border">
          <Select.ValueText placeholder={m.settings_language_label()} />
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Trigger>
      </Select.Control>
      <Select.Positioner>
        <Select.Content>
          {collection.items.map((item) => (
            <Select.Item key={item.value} item={item}>
              <Select.ItemText>{item.label}</Select.ItemText>
              <Select.ItemIndicator />
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  )
}
