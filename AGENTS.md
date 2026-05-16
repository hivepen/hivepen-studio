# AGENTS

## Chakra UI MCP usage

- When a task involves Chakra UI (especially component props, examples, theme tokens, or v2→v3 migration), use the Chakra UI MCP server (`chakra-ui`) to fetch authoritative details.
- If MCP tools are unavailable, say so and proceed with best-effort guidance.
- When styling themed panels, stats, badges, or grouped surfaces, prefer setting `colorPalette` on the parent and styling descendants with palette tokens like `colorPalette.fg`, `colorPalette.muted`, `colorPalette.subtle`, `colorPalette.border`, and `colorPalette.solid` instead of hardcoded colors or ad hoc gradients.

## UI copy guardrails

- Do not add obvious explainer copy that merely restates what the UI already shows.
- Avoid redundant helper text such as:
  - repeating the same concept in both the panel title and subtitle
  - feature-label copy like `two-level view`, `all sources`, or similar self-descriptions
  - instructional text that explains visible percentages, totals, or labels unless the meaning is genuinely ambiguous
- Prefer shorter, information-dense subtitles. If a subtitle does not add new context, omit it instead of filling the space.
- When reviewing or editing existing UI, remove redundant explanatory copy if the surrounding layout already makes the meaning clear.
