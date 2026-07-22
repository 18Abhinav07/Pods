---
created: 2026-07-22
project: pods
ecosystem: nimiq
tags: [spec, landing-page, visual-design, motion, conversion]
---

# Pods Activity Atlas Landing Design

Related: [[2026-07-22-pods-chat-first-redesign]] | [[2026-07-21-pods-social-alpha-amendment]] | [[../../../HANDOFF]]

## Outcome

Replace the current short image collage with an art-directed, product-specific landing page that makes Pods understandable and desirable before wallet connection. The experience must feel active, human, and premium while remaining fast inside the Nimiq Pay WebView.

The page has exactly two conversion actions:

- `Connect wallet` routes to `/connect?returnTo=%2Ftoday`.
- `Discover Pods` routes to `/discover`.

No other landing element behaves as a competing call to action.

## Product truth

The landing page presents capabilities that exist in the current product:

- Five fixed activity templates.
- Public application communities and private invitation communities.
- Per-occurrence commitments and evidence.
- Pod rooms with messages, proof cards, replies, and reactions.
- Supporting-image visibility as reviewer-only or Pod-shared.
- NIM funding with visible wallet, chain, credit, and roster states.

The page does not claim guaranteed rewards, production-grade custody, automatic verification, fake user counts, fake testimonials, or outcomes not implemented in the current alpha.

## Creative direction

The approved direction is **Activity Atlas**.

- Texture: editorial warmth using the existing bone canvas and deep ink, with one restrained signal-green accent.
- Layout: asymmetric editorial split in the hero, followed by a Z-axis activity cascade and varied two-column story sections.
- Typography: the existing Mulish variable family and Fira Mono. No new font request is introduced.
- Identity: the Signal Bloom mark remains the central brand device.
- Materiality: major visual panels use a nested outer shell and inner core. Supporting text is grouped through space rather than excessive cards.

The design borrows the cinematic pacing and large visual rhythm of the supplied reference, not its unrelated black-video agency components.

## Page architecture

### 1. Floating identity header

Purpose: establish Pods without adding navigation clutter.

- Signal Bloom mark and lowercase `pods` wordmark.
- A quiet `Built for Nimiq Pay` indicator.
- No header navigation links or duplicate buttons.
- The header is detached from the viewport edge and visually integrated with the hero.

### 2. Activity Atlas hero

Purpose: explain the value proposition and show the product's emotional range in the first viewport.

Copy:

- Eyebrow: `Accountability, backed by NIM`
- Heading: `Make showing up feel real.`
- Body: `Create a Pod. Put NIM behind the activity. Prove the work together.`
- Actions: `Connect wallet` and `Discover Pods`

The visual half contains:

- A central active-Pod panel with a current occurrence, deadline, and proof state.
- Build & Ship, Fitness, and Reading photography from the repository.
- Smaller Study and Practice & Create signal labels.
- A restrained Signal Bloom orbit joining the activity fragments.

The visual is illustrative and non-interactive. It cannot be confused with real user data or a third call to action.

### 3. Activity ribbon

Purpose: communicate template breadth without a generic feature grid.

- A continuous text and image ribbon for Build & Ship, Fitness & Movement, Reading, Study & Focus, and Practice & Create.
- The ribbon pauses when reduced motion is requested.
- No links are attached to ribbon items.

### 4. The accountability loop

Purpose: explain the complete product loop in under thirty seconds.

Four sequential moments:

1. `Define the activity`
2. `Commit NIM`
3. `Submit proof`
4. `Build momentum`

Desktop uses an offset visual rail with one active stage at a time. Mobile presents a single readable vertical path. The Signal Bloom geometry travels through the sequence using transform and opacity only.

### 5. One engine, five rituals

Purpose: demonstrate that Pods is broader than a fitness-staking product.

- Build & Ship receives the largest landscape panel.
- Fitness and Reading use tall editorial panels.
- Study and Practice & Create appear as smaller supporting moments.
- Each panel names the actual evidence behavior of that template rather than generic lifestyle copy.

### 6. Inside a Pod

Purpose: show that accountability happens in a social room, not an administrative dashboard.

The section renders an illustrative room fragment containing:

- A creator announcement.
- A member message.
- A locked commitment card.
- A submitted proof card.
- Compact support reactions and reply context.
- Reviewer-only and Share with Pod visibility labels.

No evidence image, user identity, or financial value comes from the live database.

### 7. NIM commitment rail

Purpose: make the Nimiq integration concrete and central.

The visual rail contains the actual participant-facing sequence:

1. Wallet confirmation
2. Transaction submitted
3. Chain finalized
4. Ledger credited
5. Place secured

Copy describes traceability and visible state. It does not promise profit or settlement behavior beyond the current alpha.

### 8. Public and private spaces

Purpose: clarify how users enter communities.

- Public Pods are discoverable, application-based, and creator-approved.
- Private Pods are invitation-only and absent from discovery.

This is a visual split, not another navigation surface.

### 9. Closing statement

Purpose: leave a memorable brand idea without repeating conversion controls.

- Statement: `Small commitments become visible momentum.`
- Signal Bloom closes the page.
- Footer identifies Pods as a Nimiq Pay Mini App.
- No additional buttons are introduced.

## Motion system

Motion uses the installed `motion` package inside isolated client components.

- Hero media enters through a staggered heavy fade and slight Z-axis translation.
- Activity fragments float by no more than 8 pixels and rotate by no more than 1.5 degrees.
- The activity ribbon uses a seamless transform loop.
- Scroll reveals use `whileInView` with one-time activation.
- Buttons use spring press feedback and a nested trailing-arrow island.
- Hover effects are enhancement only and never hide information.
- No animation changes top, left, width, or height.
- Reduced-motion users receive static, fully composed layouts with no lost content.

## Component architecture

- `HomePage` remains a server-safe composition and owns copy, links, and semantic section order.
- `LandingMotion` is a focused client leaf responsible for entrance choreography and in-view reveals.
- `ActivityAtlasVisual` owns the hero collage.
- `ActivityRibbon` owns the template loop.
- `AccountabilityLoop` owns the four-stage explanatory rail.
- `PodRoomPreview` owns the illustrative room composition.
- `FundingRailPreview` owns the NIM state sequence.

All components consume fixed presentation data. They do not query the database, inspect the wallet, or alter authentication behavior.

## Responsive behavior

- Hero uses `min-height: 100dvh`, never `100vh`.
- Below 768 pixels, every asymmetric layout becomes a single-column composition.
- Hero copy appears before the visual on mobile.
- Media rotations and overlaps are reduced on mobile to prevent touch and overflow problems.
- The two actions stack at narrow widths and remain at least 44 pixels high.
- Sections use safe-area-aware horizontal and bottom padding.
- No horizontal page scrolling is permitted.

## Media and performance

- Use only local repository images in the first implementation.
- Use `next/image` with explicit responsive `sizes`.
- Avoid externally hosted video, external fonts, and runtime media fetches.
- Decorative animation is isolated and memoized where it loops continuously.
- Large scrolling containers do not use backdrop blur.
- A static composition remains visible when JavaScript is unavailable.

## Accessibility

- Decorative collage content is hidden from assistive technology when equivalent text exists.
- Informative images have specific activity-focused alt text.
- Section headings form one logical hierarchy.
- Contrast meets WCAG AA for body copy and controls.
- Focus treatment remains visible on both landing actions.
- Reduced-motion preference is honored in JavaScript and CSS.

## Failure and fallback behavior

- If an image cannot load, its panel retains a labelled color field and does not collapse.
- If motion cannot initialize, all content remains present in its final position.
- Connect and discovery links remain ordinary server-rendered anchors.
- The landing page introduces no data loading, empty, or authentication error states.

## Acceptance criteria

- The page contains exactly one Connect wallet link and one Discover Pods link.
- The existing wallet return route is unchanged.
- All nine content sections are present and semantically ordered.
- The page contains no fake social proof or unsupported financial claims.
- The hero communicates at least three activity categories visually.
- The activity breadth names all five fixed templates.
- Pod-room proof privacy is represented accurately.
- The NIM rail uses the actual funding state language.
- Mobile at 390 pixels has no clipped copy, overlapping actions, or horizontal overflow.
- Desktop at 1440 pixels uses an asymmetric composition rather than a centered hero.
- Reduced motion disables perpetual movement while retaining the complete design.
- Copy check, lint, typecheck, unit tests, integration tests, and production builds pass.
