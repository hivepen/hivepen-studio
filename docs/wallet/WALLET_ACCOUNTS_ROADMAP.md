# Hivepen Studio Wallet & Connected Accounts Roadmap

This roadmap is the canonical source of truth for Hive wallet authentication,
account management, and PeakD-style multi-account workflows in Hivepen Studio.

## Goals

- Make wallet connection reliable across Hive Keychain and HiveAuth.
- Support multiple connected Hive accounts without forcing repeated login/logout
  loops.
- Preserve a clear active-account concept for default operations.
- Grow toward PeakD-style per-action account selection and multi-account voting.

## Phase 1 — Aioha Migration + Desktop HiveAuth UX

- [x] Migrate wallet auth and signing flows to `@aioha/aioha`.
- [x] Support HiveAuth desktop QR approval flow.
- [x] Hide Android-only intent links on desktop.
- [x] Polish the pending HiveAuth panel with a neutral, centered layout.

## Phase 2 — Multiple Connected Accounts + Hot Switching

Goal: connect more than one Hive account at a time and switch the active account
without reauthenticating every session.

- [x] Expose connected accounts from the shared wallet provider.
- [x] Track active/inactive accounts from Aioha persistent logins.
- [x] Allow connecting another account without logging out the current one.
- [x] Allow switching the active account from the app shell menu.
- [x] Allow disconnecting a specific inactive account.
- [x] Promote another connected account when disconnecting the active account.
- [ ] Surface connected-account expiration details in the UI when helpful.

## Phase 3 — Per-Action Account Override

Goal: keep a default active account while allowing specific actions to opt into a
different connected account.

- [ ] Add optional account overrides to vote/comment/publish action flows.
- [ ] Show the account being used in action confirmations and pending states.
- [ ] Keep default operations bound to the active account unless overridden.

## Phase 4 — PeakD-Style Multi-Account Voting

Goal: support voting with several connected accounts from the same post action
surface.

- [ ] Add a voting submenu on post cards and post details.
- [ ] Let users select multiple connected accounts for one vote flow.
- [ ] Let users assign a different vote weight per selected account.
- [ ] Batch or sequence vote broadcasts with clear per-account progress and
      failure states.

## Phase 5 — Broader Wallet Parity

- [ ] Comment with a non-active connected account.
- [ ] Publish with a non-active connected account.
- [ ] Add connected-account analytics and reward summaries.
- [ ] Add wallet/account management to Settings.
- [ ] Explore support for additional Aioha providers where they improve Hivepen.

## Notes

- The active account remains the compatibility layer for existing routes until
  downstream consumers are explicitly migrated.
- Connected-account analytics should reference this roadmap for wallet-state
  ownership instead of defining parallel wallet behavior elsewhere.
