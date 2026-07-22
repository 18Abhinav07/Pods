---
created: 2026-07-22
project: pods
ecosystem: nimiq
tags: [session, codex, hackathon, design]
---

# Pods Redesign Session

Related: [[HANDOFF]] | [[sessions/INDEX]]

## Completed

- Defined the Living Momentum system in `DESIGN.md` and `.impeccable/design.json`.
- Added a canonical token and CSS layer after legacy route styles.
- Rebuilt first-run, onboarding, Today, Discover, My Pods, Messages, Profile, Updates, creation, Pod room, and supporting financial and activity surfaces.
- Added deterministic activity artwork variation, 16-pixel mobile form fields, contained media, compact navigation, and reduced-motion behavior.
- Inspected authenticated 390-pixel browser captures and corrected onboarding glass, unreadable empty states, repeated Pod art, legacy finance colors, and the compressed creation gallery.
- Replaced oversized direct-message cards with compact incoming and outgoing conversation states, one-row mobile composer behavior, viewer-aware avatars, and exact current-activity actions.
- Added visual approved-proof achievements, member-to-profile navigation, active-member Contract access, controlled discovery details, controlled profile safety actions, and admission-source-correct Updates events.
- Exercised real signed browser sessions for onboarding, profile settings, Pod proof sharing, Pod rooms, Activity, Members, Contract, Updates, People, Following, message requests, direct messages, and friend requests.
- Consolidated authenticated Pod navigation into one compact room with a countdown strip, progressive-disclosure tools, a safe-area composer, and no duplicate Today or Activity tabs.
- Replaced permanent chat controls with long-press and More actions, compact reaction badges, replies, and creator-only moderation controls.
- Rebuilt proof entry around automatic drafts, one visibility decision, direct image upload, and one Review and submit action.
- Fixed authenticated shared-proof rendering by bypassing the Next image optimizer and presenting the proof as a compact clickable room thumbnail.
- Replaced the oversized My Pods create control with an accessible circular action and verified the final rendered layout.
- Removed People and Following from Discover, moved bounded handle search into Profile, and made optional signed sessions reuse the persisted profile so avatars remain stable across routes.
- Replaced the visitor application band with a circular media action while preserving compact relationship-aware states for applicants, funded members, and joined members.
- Made the Pod room conversation-first with no redundant back action, a true bottom-attached full-width composer, visible send states, and a responsive occurrence strip that does not clip.
- Derived recurring lock, add, continue, view, upcoming, and completed proof actions from the authoritative member schedule without changing frozen Pod dates.
- Rebuilt Proofs as an authorized, paginated, member-filtered history with All and Mine scopes, participant identity, review state, and group-safe attachments only.
- Added durable quoted replies to Pod rooms and direct conversations using the existing reply relation, a batched privacy-safe preview projection, bounded authorized context retrieval, and optimistic local rendering.
- Added quote-to-original navigation with reduced-motion-aware scrolling, a 1,200-millisecond non-shifting highlight, hidden-target redaction, unavailable-target fallback, and a fixed lime enabled send state.

## Verification

- Fresh `pnpm check` passed with copy and lint checks, all typechecks, 311 root/unit/component tests, 48 live integration tests, and production web and worker builds.
- The authenticated Android Chromium and Mobile Safari suites each passed all 4 journeys using real Nimiq signatures and two independent wallet sessions where required.
- Final visual inspection covered Discover, room empty and message states, proof actions, Proofs, Profile, people search, and direct messages at 390-pixel mobile width.
- `http://192.168.29.244:3411` returned HTTP 200 after verification.
- Physical Nimiq Pay approval remains a separate pending gate.
- Fresh reply verification passed `pnpm check` with 318 root/unit/component tests, 48 live integration tests, and production web and worker builds.
- Mobile Safari and Android Chromium each passed all 4 journeys with reply persistence, light and dark quote contrast, fixed lime send, and original-message navigation; final captures were inspected at mobile width.

## Errors Resolved

- Sandboxed integration tests could not reach `127.0.0.1:54329` or `127.0.0.1:59000`; the same full gate passed with authorized local-service access.
- The room proof image initially broke because the Next image optimizer did not preserve the authenticated route context; direct unoptimized delivery fixed it and the browser now renders the uploaded proof.
- Mobile WebKit rejected whole-form `reportValidity()` when hidden file controls were present; explicit required-field checks now gate upload and final submit while server validation remains authoritative.
- A live countdown initialized from `Date.now()` caused server-client text drift and a hydration overlay. The server now serializes effective audited time and the client advances from that stable anchor after hydration.
- A legacy negative composer margin pushed the fixed surface 28 pixels beyond the WebView. The canonical room rule now resets the margin, keeps safe-area padding internal, and disables the Next.js development indicator that covered the bottom-left action during LAN testing.
- Repeated visual runs produced duplicate search matches because the tests queried constant handle prefixes. The journeys now query complete unique handles and pass sequentially in both mobile projects.
- A resumed Next dev process kept a stale workspace-package projection even while client files hot-reloaded. Restarting only the verified Pods server PID loaded durable reply previews for server-rendered refreshes.
- A generic viewer-owned quote rule produced white text on a light Pod message. Scoping inverse quote colors to dark direct-message viewer bubbles restored contrast in both room types.

## Next

- Run the complete mobile flow inside Nimiq Pay using the LAN build and record route-specific approval or defects.

## Release operation

- Stopped the verified LAN server before resetting state.
- Removed every local application record from 28 tables while preserving all 10 Drizzle migration rows and the complete schema.
- Removed 64 objects from the local `pods-evidence-local` bucket and verified the bucket is empty.
- Corrected the audited Clock integration fixture so a genuinely empty database uses one consistent real-time snapshot.
- Reran the full repository gate successfully: 318 root/unit/component tests, 48 live integration tests, copy and lint, all typechecks, and both production builds.
- Published application release `b3d96cb` to GitHub `main` and `phase/04a-social-alpha-foundation`, then verified both remote refs.
- Railway production cleanup and deployment remain blocked because the authenticated account lists zero projects and cannot access the linked Pods project. No duplicate Railway project was created.
