---
created: 2026-07-28
last-updated: 2026-07-28
project: pods
ecosystem: full-stack
tags: [mainnet, distribution, shareables, social, privacy, planning]
---

# 20: Distribution Integrations

Status: review

Related: [[docs/mainnet-planning/05-access-consent-and-visibility|Access contract]] |
[[docs/mainnet-planning/12-activity-ledger-timelines-and-shareables|Shareable contract]] |
[[docs/mainnet-planning/16-build-and-ship-protocol|Build and Ship protocol]] |
[[docs/mainnet-planning/24-product-information-architecture-and-routes|Information architecture]] |
[[HANDOFF]] | [[README]]

## Purpose

Let a person, Project, or organizer turn approved Pods activity into a useful
public story and deliberately hand it to X, Discord, Skool, Telegram,
WhatsApp, or another destination without making Pods a cross-platform posting
bot or claiming that a handoff was published.

Distribution always begins with a bounded Shareable from Document 12. It never
begins from raw proof, room messages, private timelines, or integration
payloads.

## Product Outcomes

Distribution should help:

- builders communicate progress once instead of rewriting the same update;
- Projects present a coherent build journey;
- organizers publish season highlights and recaps;
- visitors enter the exact public Project, Pod, Event, or share page;
- contributors retain clear credit and privacy choice;
- Pods measure its own interaction and link-entry funnel without tracking people
  across external platforms.

## Canonical Records

### DistributionIntent

One user-initiated request to distribute one Shareable:

- actor and representative scope;
- Shareable version;
- selected destination;
- selected format;
- generated text and media snapshot;
- consent and visibility version;
- creation and expiry;
- state.

The intent and its generated draft content are actor-private. They do not create
a public page, grant a new audience, or appear in Activity until Document 12
separately publishes the source Shareable. Expired, cancelled, and abandoned
intents have bounded cleanup for generated temporary media while their minimal
audit receipt follows the retention policy.

`DistributionIntent` uses Document 23's `private person` data class and
encrypted storage. An untouched intent expires after 24 hours. Temporary
generated media is deleted within 24 hours after expiry, cancellation, or
terminal interaction. A minimal redacted intent and interaction receipt is
retained for 30 days for abuse investigation and delivery debugging, then
deleted or converted into non-personal aggregate analytics unless a named
security or legal hold applies.

### DistributionInteractionReceipt

Records the result Pods can actually observe:

- native share invoked;
- native share promise resolved;
- native share cancelled or failed;
- content copied;
- file downloaded;
- deep link opened;
- provider API request submitted;
- confirmed external post identifier, where a future validated API supplies it.

`navigator.share()` resolving means only that the promise resolved according to
the user agent, at a platform-dependent point. It does not prove that a target
was selected, which destination received the content, that the destination
published it, or that anyone viewed it. Clipboard copy and opening an external
application prove even less.

### ExternalPublication

Created only when a validated platform API returns a durable publication ID
that Pods can later reconcile. Initial Mainnet does not require this object.

## Initial Distribution Methods

### Native Web Share

Use `navigator.share` where supported to send user-selected text, links, and
eligible files to a target chosen by the operating system. The Web Share API
requires a secure context and is not available across every browser, so the UI
must feature-detect it and offer fallbacks. Before sharing files, Pods also
uses `navigator.canShare()` with the exact file set when available rather than
assuming file support from text or link support.

Source:
https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share

Required fallbacks:

- copy safe text;
- copy public link;
- download image card;
- download compact Project or Event recap;
- open an explicitly labeled destination URL where safe.

### Share Links

Each published Shareable receives:

- an opaque public token or public slug;
- title, description, image, and safe attribution metadata;
- a canonical Pods URL;
- access and withdrawal enforcement;
- no private query parameters;
- no wallet, repository credential, or internal object ID.

### Image Cards

Generated from the published snapshot:

- Pods identity;
- exact activity or milestone;
- contributor credit;
- Project or Event context;
- precise proof basis;
- timestamp or time range;
- optional result;
- QR code or short link where useful;
- accessibility text.

Cards never show private evidence, raw financial amounts, wallet addresses,
reviewer notes, youth status, or private Pod names.

### Text Kits

Destination-aware but user-editable:

- short progress update;
- milestone announcement;
- weekly build recap;
- Event highlight;
- final Project story.

Generated text clearly separates participant narrative from verified Pods
facts. The person reviews it before any distribution interaction.

## Destination Strategy

### X

Initial support is native share or copy. Pods does not request account access
or auto-post. Text is concise and links to the exact public Shareable.

### Discord

Initial support is link and copy with a strong safe preview. A future bot or
webhook integration requires explicit server administrator consent, channel
selection, revocation, rate limits, and separate validation.

### Skool

Initial support is copy plus public link because no product assumption is made
about an unpublished or unstable posting API. The share kit may provide a
community-friendly narrative but the user publishes it.

### Telegram and WhatsApp

Initial support is the native share sheet or approved link handoff. Pods does
not claim message delivery or group membership.

### Other Platforms

No destination receives a special adapter until it provides a documented,
stable, permissioned path and passes the same consent, privacy, revocation,
and reconciliation review.

## Distribution Flow

```text
eligible authoritative fact reaches publishable state
-> actor opens its Share panel owned by Document 12
-> Pods shows exact included facts, credits, and audience
-> actor selects or edits narrative
-> Document 12 generates and publishes a versioned Shareable snapshot
-> actor creates an actor-private DistributionIntent for that published version
-> actor chooses native share, copy, link, or download
-> Pods records only the interaction it can observe
-> visitor follows the public link into its safe projection
```

Project and Event share flows use a representative capability and may select
only material already authorized for the destination audience.

## Visibility and Consent Rules

1. The source visibility in Document 05 is the maximum audience.
2. Every contributor-visible artifact retains its PublicationGrant.
3. A Project lead can curate eligible Project activity but cannot publish
   another person's private proof or room message.
4. Removing a public profile does not automatically withdraw Project facts
   that were separately and validly published under a Project contract.
5. Withdrawal disables the Pods-hosted Shareable and future preview rendering.
   It cannot recall screenshots, downloads, or content already posted
   elsewhere.
6. Share metadata follows the same authorization as the page. A denied page
   cannot leak title, image, member names, or description in unfurl metadata.
7. Initial youth accounts cannot publish to external distribution targets.
   Context-authorized adults may publish only object-level material that does
   not identify or expose a youth participant.
8. A public artifact becoming private marks affected Shareables withdrawn or
   invalidated according to the source contract.

## Public Entry and Conversion

A visitor entering a Shareable may:

- view the exact safe snapshot;
- open the current public Project, Event, or Pod if still eligible;
- inspect claim basis;
- discover the contributor only if their profile is public;
- sign in to follow, apply, or create;
- report unsafe or misleading content.

A visitor may not:

- infer private membership or financial status;
- view raw proof or reviewer notes;
- reuse the link as an invitation;
- bypass application, consent, funding, or roster rules;
- interact with a member room through a public share page.

## Analytics

Pods may record:

- Shareable created;
- public page viewed;
- Pods-owned CTA selected;
- `native_share_invoked`;
- `native_share_resolved`;
- `native_share_cancelled_or_failed`;
- copy selected;
- download selected;
- signed-in conversion to an allowed Pods action.

Pods does not:

- install cross-site trackers by default;
- infer external posting from a distribution interaction;
- scrape external engagement;
- convert clicks, reactions, or follower counts into reputation;
- expose individual visitor analytics to organizers beyond approved aggregate
  policy.

## State Model

The Shareable lifecycle belongs exclusively to Document 12. Distribution holds
only its immutable version reference and cannot publish, withdraw, or
invalidate it.

DistributionIntent:

```text
prepared -> interaction_started
prepared -> cancelled | expired
interaction_started -> interaction_resolved | cancelled_or_failed
```

For native sharing, `interaction_started` records `native_share_invoked`.
`interaction_resolved` records `native_share_resolved`, and
`cancelled_or_failed` records only that the promise rejected or the interaction
was cancelled. None is an external publication receipt.

ExternalPublication, if a future adapter is validated:

```text
unknown -> confirmed -> changed | removed | inaccessible
```

## Commands and Facts

Representative commands:

- `CreateDistributionIntent`
- `RecordDistributionInteraction`
- `ExpireDistributionIntent`
- `ReconcileExternalPublication`

Representative facts:

- `DistributionIntentCreated`
- `DistributionInteractionStarted`
- `DistributionInteractionResolved`
- `DistributionInteractionCancelledOrFailed`
- `DistributionIntentCancelled`
- `DistributionIntentExpired`
- `ExternalPublicationConfirmed`

## Required Validation Gate

- native share inside supported Nimiq Pay WebViews;
- feature detection and unsupported-browser fallback;
- share cancellation and repeated invocation;
- text, link, and file capability differences;
- safe unfurls for public, withdrawn, invalid, unknown, and private resources;
- no private fields in generated media metadata;
- contributor credit and visibility changes;
- public-to-private source transition;
- download accessibility and image quality;
- clipboard failure;
- link entry while signed out and after sign-in;
- destination copy limits and encoding;
- youth publication block;
- analytics redaction;
- platform adapter revocation before any direct-post feature.

## Failure States

- not publishable;
- contributor consent missing;
- source still provisional;
- source became private;
- share unsupported;
- clipboard denied;
- file type unsupported;
- distribution interaction cancelled;
- Shareable withdrawn;
- destination unavailable;
- public Project or Event archived;
- external publication state unknown.

## Non-goals

- Automatic social posting.
- Social account credential collection in initial Mainnet.
- External engagement analytics.
- Replacing a community platform.
- Treating distribution as proof or reputation.
- Promising deletion outside Pods.

## Interdependencies

- Document 05 owns audience ceilings and consent.
- Document 12 owns Shareables and safe snapshots.
- Document 13 owns claim wording.
- Document 14 owns Pods-native social interaction.
- Document 15 owns delivery notifications, not external publishing.
- Document 16 owns Build and Ship story semantics.
- Document 17 owns organizer publication capability.
- Document 22 owns optional platform adapters and durable jobs.
- Document 23 owns secrets, abuse protection, and compliance.
- Document 24 owns public entry routes.
- Document 25 owns environment-specific callback and preview origins.

## Review Findings

- Document 12 exclusively owns Shareable publication and withdrawal.
- DistributionIntent is private and cannot broaden the source audience.
- Native share, copy, and download record only the interaction Pods can
  observe.
- External publication is never inferred from a resolved browser promise.
- Public entry preserves contributor consent and cannot bypass participation
  gates.

## Closure Condition

Lock after physical Web Share and fallback behavior, safe preview metadata,
private-to-public and public-to-private transitions, cleanup and retention,
youth restrictions, accessibility, and destination copy constraints pass the
validation gate in the exact supported clients.
