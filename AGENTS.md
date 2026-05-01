# AGENTS

## Chakra UI MCP usage

- When a task involves Chakra UI (especially component props, examples, theme tokens, or v2→v3 migration), use the Chakra UI MCP server (`chakra-ui`) to fetch authoritative details.
- If MCP tools are unavailable, say so and proceed with best-effort guidance.
- When styling themed panels, stats, badges, or grouped surfaces, prefer setting `colorPalette` on the parent and styling descendants with palette tokens like `colorPalette.fg`, `colorPalette.muted`, `colorPalette.subtle`, `colorPalette.border`, and `colorPalette.solid` instead of hardcoded colors or ad hoc gradients.
