---
created: 2026-07-21
project: pods
ecosystem: nimiq
tags: [decisions, architecture, phase-4]
---

# Pods Decision Log

Related: [[HANDOFF]] | [[docs/superpowers/plans/2026-07-21-phase-4-social-alpha]]

| Date | Decision | Rationale | Alternatives |
|---|---|---|---|
| 2026-07-21 | Freeze every new Phase 4 Pod as `full_refund_alpha`. | The activity and social product can be tested end to end without implying unimplemented proportional settlement; contract hashing prevents later reinterpretation. | Continue showing proportional forfeiture copy before Phase 6; rejected as unsafe and misleading. |
| 2026-07-21 | Keep financial and review state authoritative outside messaging. | Reactions, replies, follows, friendships, and blocks must never mutate membership, evidence outcomes, ledger entries, or returns. | Treat chat cards as copied state; rejected because duplicated financial state can drift. |
| 2026-07-21 | Use two-second cursor polling for the current alpha. | The required physical SSE replay gate was not completed, while polling has deterministic reconciliation behavior inside Nimiq Pay. | Ship unverified SSE or introduce WebSockets; both rejected for this phase. |
| 2026-07-22 | Make `design-system.css` the canonical final visual layer. | Loading the approved warm, activity-led tokens after legacy route CSS lets every Phase 4 surface converge without risking a destructive rewrite of validated state behavior. | Continue appending route-specific themes to `globals.css`; rejected because it recreated mixed visual systems. |
| 2026-07-22 | Keep Pod conversations in My Pods and reserve Messages for people and requests. | A Pod is an activity destination with chat inside it, while Messages owns private social communication; separating them removes duplicate room inventories and route ambiguity. | List Pod rooms in both My Pods and Messages; rejected because both tabs would own the same destination. |
| 2026-07-22 | Deliver authenticated shared-proof images directly without Next image optimization. | The proof endpoint requires the viewer session, and the optimizer request did not preserve that authenticated access in the rendered room. | Proxy credentials through the optimizer or duplicate proof objects publicly; rejected because the first adds unnecessary complexity and the second weakens privacy. |
| 2026-07-22 | Keep Discover Pod-only and make Profile the owner of people search and relationship lists. | Discover serves the activity acquisition journey, while a bounded query-first people surface prevents a heavy global directory and keeps social identity attached to the user profile. | Keep People and Following as Discover segments; rejected because it mixes unrelated user intents and duplicates Profile. |
| 2026-07-22 | Project quoted replies from the authoritative message relation instead of copying quote text into chat state. | Batched same-conversation lookup preserves refresh durability, redacts hidden targets, and keeps moderation authoritative while allowing optimistic mobile rendering. | Persist copied sender and excerpt fields on every reply; rejected because copied private content could outlive moderation and drift from the original. |
| 2026-07-22 | Adopt Signal Bloom as the Pods identity with a Grounded Ink transparent mark and lowercase wordmark. | The four gathered signals communicate shared activity across every template, remain legible at favicon size, and avoid crypto, fitness, and productivity category clichés. | Shared Orbit and Momentum Stack; rejected because they read more like a loader and a growth chart. |
| 2026-07-22 | Keep the Activity Atlas landing light and reduce its header actions to `Pods` then `Wallet`. | A plain discovery link and one lime wallet pill preserve the hero as the visual focal point while removing the redundant connect route from normal entry. | Convert the landing to dark mode or keep two large hero buttons; rejected because both changes weakened the approved activity-led composition. |
