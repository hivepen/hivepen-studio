# Roadmap Contribution Rules

These rules keep the roadmap usable across agents and threads.

## Tooling

- Use `bun` for dependency installation and scripts (examples: `bun install`, `bun add`, `bun run build`).
- Avoid introducing `npm`/`yarn` commands unless explicitly requested.

## Updating the Roadmap

- Update `docs/roadmap/ROADMAP.md` when features are added, removed, or reprioritized.
- Mark completed items with `[x]` and move them into **Current Foundations (Done)** when appropriate.
- Keep iteration scopes realistic and avoid mixing unrelated concerns in the same item.

## Updating the Changelog

- Append notable roadmap changes to `docs/roadmap/CHANGELOG.md` with the date.
- Keep entries concise and focused on what changed.

## Documentation Note

This roadmap documentation is a living system and can be expanded and updated whenever requirements evolve.

## Chakra UI v3 Notes

- Flex-based layout components use `gap` (not `spacing`).
- Use `spaceX` / `spaceY` for non-flex layout spacing.
- Prefer Chakra semantic tokens (`bg`, `fg`, `border`, `panel`, `muted`, etc.) and built-in components over custom styles.
- Minimize bespoke CSS/colors unless there is a clear product requirement.
- Use Chakra v3 namespace components for Ark UI-based widgets (example: `Select.Root`, `Select.Trigger`, `Select.Item`, `Avatar.Root`, `Avatar.Image`, `Avatar.Fallback`). Avoid legacy single-component APIs that return objects instead of components.

## Git Workflow

- Always work on a `codex/` prefixed branch.
- Use Conventional Commits for all commit messages (examples: `feat: ...`, `fix: ...`, `chore: ...`).

## Routing

- Prefer single-word routes and filenames (example: `/blog` instead of `/my-blog`).
