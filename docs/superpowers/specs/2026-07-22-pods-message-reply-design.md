---
created: 2026-07-22
project: pods
ecosystem: nimiq
tags: [design, messaging, replies, mobile-ux]
---

# Pods Message Reply Design

Related: [[2026-07-22-pods-discovery-room-proof-correction]] | [[../plans/2026-07-22-pods-chat-first-redesign]] | [[../../../HANDOFF]]

## Goal

Make sending and replying feel immediate and legible in both Pod rooms and direct conversations without changing message authority, moderation, or financial state.

## Send control

- The enabled send button uses the fixed Pods lime token `--activity-build` and a dark paper-plane icon in every Pod and direct conversation.
- The disabled state remains neutral and visibly inactive.
- Enabled, disabled, focus, pressed, and reduced-motion states preserve a 44-pixel minimum target.

## Reply projection

Each returned message may include a safe `replyPreview` projection:

- `messageId`
- `sequence`
- `senderDisplayName`
- `kind`
- `excerpt`
- `available`

The repository resolves reply targets in one batched query for the returned page. It never exposes a hidden message body, private evidence, wallet identity, or a message from another conversation. No schema migration is required because `replyToMessageId` already exists.

Text and announcement targets use a plain-text excerpt capped at 120 characters. Activity and system targets use `Activity update` and `Pods system update` when no safe text body exists. Hidden, deleted, inaccessible, or unavailable targets return `available: false` and render as `Message unavailable`.

## Reply interaction

- A reply bubble renders a compact quoted block before its own message body.
- The block shows the original sender and a maximum two-line excerpt.
- The block uses a slim lime rail and restrained surface contrast, not a nested full message card.
- Tapping an available block scrolls the original message into view and applies a 1,200-millisecond non-destructive highlight.
- If the target is not in the current client page, the UI requests `GET /api/conversations/:conversationId/messages?around=:messageId&limit=40`. The authorized response contains the target plus bounded neighboring messages, which the client inserts by message ID and sequence before scrolling.
- An unavailable block is visible but not interactive.
- The reply composer shows the same preview before sending and supports cancellation.
- Optimistic messages carry the local preview immediately and retain it when the server ID replaces the client ID.

## Failure and privacy behavior

- A failed context request leaves the current position unchanged and changes the preview to `Message unavailable`.
- Creator moderation immediately replaces any quoted hidden body with `Message unavailable` after reconciliation.
- Replies do not affect reactions, review decisions, streaks, membership, deposits, settlement, or payouts.

## Testing

- Component tests cover enabled send styling, quoted previews, optimistic replies, unavailable targets, scrolling, and highlight cleanup.
- Repository integration tests cover batched reply projection, same-conversation enforcement, hidden-body redaction, and unavailable targets.
- Route tests verify only safe reply fields leave the server.
- Mobile browser journeys cover replying, refreshing, tapping the quote, scrolling to the original, and the lime enabled send state in Pod and direct conversations.
