# Hive Community Dependencies

This document summarizes the installed Hive community libraries and how we plan to use them in Hivepen Studio.

## @hiveio/content-renderer

**Purpose**

- Canonical Hive post/comment renderer that handles Markdown + HTML, sanitization, embeds, tags, mentions, and image proxying.

**Key APIs / Usage**

- `DefaultRenderer(options)` with `render(content)` returning safe HTML.
- Options include `baseUrl`, `breaks`, `imageProxyFn`, `usertagUrlFn`, `hashtagUrlFn`, `ipfsPrefix`, and link-safety hooks.

**Configuration Notes**

- Set `breaks: true` to match common Hive UI behavior.
- Keep sanitization enabled and disallow insecure script tags.
- Provide `imageProxyFn` to proxy to `https://images.hive.blog/0x0/`.
- Provide `usertagUrlFn` and `hashtagUrlFn` for internal routes.

**How We Use It in Hivepen Studio**

- `renderHiveMarkdown()` now delegates to `DefaultRenderer` with standard Hive settings.
- Custom markdown extensions (callouts/spoilers/centered images) are removed to align with canonical rendering.

**Docs**

- npm package: [@hiveio/content-renderer](https://www.npmjs.com/package/@hiveio/content-renderer)
- Demo: [Hive Renderer Demo](https://hive.pages.syncad.com/hive-renderer/)

## @aioha/aioha

**Purpose**

- Unified authentication across Hive signers (Keychain, HiveAuth, HiveSigner, Ledger/Peak Vault) with a single API and shared session management.

**Key APIs / Usage**

- `initAioha({ hiveSigner, keychain, hiveAuth, ledger, peakVault, saveSession, allowedOperationTypes })`
- `login(account, authorities, method)`
- Signing helpers like `transfer`, `vote`, `broadcastJson`, `claimRewards`, and a generic `broadcast`.

**Configuration Notes**

- Requires a HiveSigner callback page; their docs show a minimal HTML template and initialization flow.
- Stores session data in LocalStorage (keys are reserved by Aioha).
- Vite/TS builds may require browser polyfills per the docs.

**How We Use It in Hivepen Studio**

- Planned as the unified signer layer so features can use one API regardless of Keychain vs HiveSigner.
- We will wire it into our auth stack before adding new transaction features.

**Docs**

- Docs hub: [Aioha Docs](https://aioha.dev/)
- Get Started: [Aioha Get Started](https://aioha.dev/docs/get-started)
- Usage examples: [Aioha Usage](https://aioha.dev/docs/usage)

## @ecency/sdk

**Purpose**

- Framework-agnostic Hive data layer with first-class React Query support and a unified module set for accounts, posts, wallet, communities, etc.

**Key APIs / Usage**

- Query option builders for React Query (e.g., `getPostsRankedQueryOptions`, `getAccountFullQueryOptions`).
- `ConfigManager` for shared RPC + query client configuration.

**Configuration Notes**

- Set up a shared QueryClient so all modules share cache and retries.
- Prefer query option builders to keep caching consistent.

**How We Use It in Hivepen Studio**

- Planned for post reward data, breakdown, and future analytics/market features.
- Will align with our existing TanStack Query setup.

**Docs**

- Ecency SDK docs page: [Ecency SDK](https://developers.ecency.com/documentation/sdk)
- Note: public docs are high-level; we’re relying on the installed README for detailed usage until a full API reference is available.

## @hiveio/keychain

**Purpose**

- Browser API wrapper to interact with the Hive Keychain extension for signing and broadcasting operations.

**Key APIs / Usage**

- `keychain(window, method, ...params)` to invoke extension methods.
- Helper checks: `isKeychainInstalled()`, `hasKeychainBeenUsed()`.

**Configuration Notes**

- Works only in browsers with the Keychain extension installed.
- Use as a signer implementation (directly or via `@aioha/aioha`).

**How We Use It in Hivepen Studio**

- Will be one of the signers supported by the unified Aioha auth layer.

**Docs**

- Package docs: [@hiveio/keychain on Skypack](https://www.skypack.dev/view/@hiveio/keychain)
