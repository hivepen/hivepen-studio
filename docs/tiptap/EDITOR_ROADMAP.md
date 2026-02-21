# Hivepen Studio — Notion-Style Editor Roadmap

This roadmap aligns the editor work with the current stack (TanStack Start + Chakra UI + TipTap v3).
It incorporates architecture patterns from Novel (novel.sh/docs headless package) and the Medium article in Medium
Markdown version link: https://markdown.new/vikramthyagarajan.medium.com/how-to-build-a-notion-like-text-editor-in-react-and-tiptap-7f394c36ed9d?__cf_chl_rt_tk=iukJxto6gGpptIP.EeW.el6bV62C9kW8Ke6AsLgQ1ro-1771703128-1.0.1.1-mzCptL4b_ZEUy976eli92WmRQM15DlzTZOzUEaEVODY, while keeping implementation Chakra-native.

## Guiding Principles

- Prefer TipTap v3 native APIs and extension patterns.
- Mirror Novel’s architecture (slash command, bubble menu, drag handle) but use Chakra UI for rendering.
- Keep editor extensions centralized in a single registry for reuse and future features.
- Build incrementally with stable milestones before advanced UX.

## Phase 1 — Baseline Editor Foundation

Goal: a stable editor with a clean extension registry and consistent styling.

- [ ] Create `src/lib/tiptap/extensions.ts` as the canonical extensions registry.
- [ ] Configure StarterKit with controlled headings (H1–H3) and essential marks.
- [ ] Add Placeholder with per-block messaging (heading vs paragraph).
- [ ] Verify link, image, mention, underline, code, blockquote, list, and HR behaviors.
- [ ] Align editor typography and block spacing with design tokens.

## Phase 2 — Slash Command Menu (Novel-style)

Goal: slash menu that inserts blocks without leaving the writing flow.

- [ ] Add Slash Command extension via `@tiptap/suggestion` + ReactRenderer + tippy.
- [ ] Build Chakra-based command list components:
  - `EditorCommandList`
  - `EditorCommandItem`
- [ ] Support keyboard navigation and escape behavior.
- [ ] Scope commands by context (hide inside code blocks).

## Phase 3 — Bubble Toolbar

Goal: selection-based inline formatting menu.

- [x] Add Bubble Menu wrapper (TipTap BubbleMenu + tippy).
- [x] Expose inline actions (bold, italic, underline, strike, link, code).
- [x] Handle link editing UX with inline input.

## Phase 4 — Drag Handle + Block Actions

Goal: reliable block drag/reorder and block menu actions.

- [x] Replace custom drag logic with a stable drag handle implementation.
  - Evaluate `tiptap-extension-global-drag-handle` for TipTap v3 compatibility.
  - If not compatible, port its ProseMirror plugin to v3.
- [ ] Add “block actions” menu (duplicate, delete, turn into).
- [x] Keep visibility toggle in Editor Settings.

## Phase 5 — Mentions & Suggestions

Goal: rich insertions with minimal friction.

- [ ] Upgrade mentions to a styled suggestion menu.
- [ ] Add emoji suggestions (optional).

## Phase 6 — Extended Blocks

Goal: richer long-form writing blocks.

- [ ] Task list + task items.
- [ ] Tables (optional, later).
- [ ] Media blocks (image placeholder, video embed).

## Phase 7 — Publishing Fidelity

Goal: ensure content renders correctly when published.

- [ ] Confirm Markdown/HTML export meets Hive publishing needs.
- [ ] Preview rendering parity with Hive frontends.

---

## Current Status

- Branch: `codex/editor-bubble-toolbar-handles`
- Bubble menu, toolbar sync, and drag handles in progress for Phase 3/4 deliverables.
