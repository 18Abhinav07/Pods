---
created: 2026-07-22
project: pods
ecosystem: nimiq
tags: [spec, mobile-ux, chat-first, proof, identity]
---

# Pods Chat-First Mobile Redesign

Related: [[2026-07-21-pods-social-alpha-amendment]] | [[../plans/2026-07-22-pods-chat-first-redesign]] | [[../../../HANDOFF]]

This amendment records the July 22 mobile audit decisions approved by Abhinav. It overrides the navigation and presentation clauses in the prior social-alpha amendment. Financial, privacy, authority, and persistence rules remain unchanged.

## Product model

- Today is the only global next-action surface.
- Discover contains public Pods, public people, and followed people. Private Pods never appear there.
- My Pods is the only inventory of joined and created Pods.
- Messages contains direct conversations and requests. It no longer duplicates Pod rooms.
- A roster-locked Pod opens into its conversation-first room from Today, My Pods, notifications, and relationship-aware discovery actions.

## Pod room

- The room replaces five persistent Pod tabs with a compact identity header and one context control.
- The header contains back navigation, Pod identity, a context control, and updates.
- A slim occurrence strip shows the current requirement, exact remaining time, and one action.
- The context sheet exposes proof history, members, frozen contract, sharing, and creator controls when authorized.
- Legacy `/today`, `/activity`, `/members`, and `/rules` routes remain valid deep links, but they do not form persistent navigation.

## Conversation behavior

- The composer sits at the device safe-area bottom on Pod and direct-message routes.
- Existing reactions may appear as compact badges.
- Reply, React, Copy, Pin, and Hide appear through long press and an accessible More control.
- Every action remains at least 44 by 44 pixels.
- Long press is enhancement only. The More control provides the complete keyboard and assistive-technology path.

## Proof experience

- Result summary, required artifact, attachments, and attachment visibility live in one proof composer.
- Draft persistence happens automatically when a user adds evidence or selects Review and submit.
- Each attachment displays its immutable submission visibility: Reviewer only or Share with this Pod.
- Native file inputs remain visually hidden and reachable through explicit Camera and Image actions.
- One final Review and submit action replaces competing Save and Submit actions.

## Financial language

- Occurrence consequence copy is derived from the frozen `settlementMode`.
- `full_refund_alpha` uses Activity slice and states that full Testnet principal remains returnable.
- At risk is reserved for a future mode in which an occurrence can actually reduce returned principal.

## Identity and chrome

- Profile presets use a dedicated identity system and never reuse Pod or proof photography.
- Pod covers remain activity-specific and may vary within a template.
- Utility route titles appear in the compact app header. The PODS wordmark remains on Today, onboarding, and unauthenticated entry.
- Bottom navigation is attached to the safe-area bottom, uses restrained active treatment, and does not render inside conversations.

## Acceptance

- No screen states a false NIM consequence.
- Public and private Pod entry models remain distinct and explicit.
- A participant reaches the current Pod action and room without choosing among five local tabs.
- A participant can explain the visibility of every proof attachment before submitting.
- A message does not expose a permanent action toolbar.
- My Pods and Messages no longer duplicate Pod inventory.
