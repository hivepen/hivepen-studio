# Chakra UI v3 Migration Notes (Local)

This document summarizes the official Chakra UI v3 migration guidance and a few
practical gotchas we should keep in mind for this codebase.

## Required Environment

- Minimum Node.js version: 20.x

## Packages

- Remove deprecated packages: `@emotion/styled` and `framer-motion` (no longer required in v3).
- Use `@chakra-ui/react` and `@emotion/react` as the core packages.

## Theming

- Move custom theme configuration to a dedicated `theme.ts` file.
- Use `createSystem` + `defaultConfig` to define the system (instead of v2 `extendTheme`).
- Pass the system to `ChakraProvider` via the `value` prop.

## Component & Prop Changes

- `Stack`/`HStack`/`VStack` now use `gap` instead of `spacing`.
- Boolean props drop the `is` prefix (example: `isDisabled` -> `disabled`).
- Use `gap` for layout spacing (Stack and other flex/grid layouts).
- Use `spaceX` / `spaceY` to add spacing between children using the owl selector.

## Helpful Links

- Chakra UI official migration guide (v2 -> v3)
- Chakra UI v2 vs v3 comparison blog
