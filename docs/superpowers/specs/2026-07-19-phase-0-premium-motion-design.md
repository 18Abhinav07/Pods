---
created: 2026-07-19
project: pods
ecosystem: nimiq
tags: [pods, phase-0, ui, motion, design]
status: approved
---

# Pods Phase 0 Premium Motion Design

Related: [[10-Projects/Web3-Builds/Hackathons/Pods/BUILD/README|Pods build README]] | [[10-Projects/Web3-Builds/Hackathons/Pods/BUILD/docs/design-reference/README|Locked design references]] | [[10-Projects/Web3-Builds/Hackathons/Pods/docs/superpowers/specs/2026-07-19-pods-cycle-i-mvp-design|Cycle I product specification]]

## Goal

Raise the locked Earned Momentum shell from polished-but-static to premium app
motion without changing its typography, palette, layout, content hierarchy, or
Phase 0 product boundary.

## Motion character

Motion communicates physical weight and continuity. Text is light, panels are
heavier, selections move as one connected object, and financial or error states
remain immediate. The interface must feel composed rather than animated for its
own sake.

The implementation uses a hybrid model:

- CSS transform and opacity choreography for first render and ambient status.
- `motion@12.42.2` in one isolated client component for spring selection and
  content continuity.
- No scroll hijacking, cursor effects, glow, blur animation, confetti, or fake
  navigation.

## Timing and physics

| Interaction | Contract |
|---|---|
| Page entrance | 900ms maximum sequence using `cubic-bezier(0.16, 1, 0.3, 1)` |
| Entrance stagger | 55ms between template rows |
| Tactile press | 140ms to `scale(0.98)` |
| State transition | 220ms |
| Navigation-weight transition | 280ms |
| Selection spring | stiffness 320, damping 30, mass 0.72 |
| Ambient status cycle | 6000ms, low amplitude, no layout movement |

The entrance order is wordmark and phase indicator, hero eyebrow and headline,
hero description, status panel, section heading, then template rows. No element
moves farther than 18px. Surfaces may begin at `scale(0.985)` and settle at
`scale(1)`.

## Interactive template showcase

The five template rows become semantic selector buttons. They do not navigate
or imply that full Pod creation is available. Selecting a row updates one fixed
detail region below the list with that template's evidence contract:

| Selector | Detail summary |
|---|---|
| Move | In-app photo, completion note, measurable activity minimum |
| Read | Title, pages or minutes, reading artifact, optional note |
| Focus | Topic, duration, focus artifact, short takeaway |
| Build | Locked task, result summary, GitHub or live artifact link |
| Create | Locked output goal, artifact, reflection |

The selected indicator uses a shared layout transition. Detail content exits
with 6px upward movement and enters from 8px below. Press feedback is immediate
on touch. Hover effects are enabled only on devices that support hover.

## Ambient behavior

- The status dot breathes through opacity and scale.
- The decorative status ring drifts by at most 4px and 2 degrees.
- The three wordmark circles settle with a short sequential entrance.
- Ambient motion never changes document geometry or competes with reading.

## Accessibility and performance

- `prefers-reduced-motion: reduce` disables entrance, ambient, shared-layout,
  and content-transition motion while retaining visible state changes.
- Buttons expose `aria-pressed`; the detail region is labelled and announced
  without stealing focus.
- Animation uses only `transform` and `opacity`.
- Continuous motion is CSS-only and isolated to two pseudo-elements.
- The shell must retain zero horizontal overflow in Mobile Safari and Android
  Chromium.

## Acceptance criteria

- Every major section has a coherent first-render entrance.
- Every template selector has visible hover, focus, press, and selected states.
- Selecting each template displays the correct evidence contract.
- Reduced-motion mode makes all content immediately readable without ambient
  loops.
- Existing palette, type, copy, safe-area behavior, and narrow layout remain
  unchanged.
- Unit tests, both mobile browser projects, production build, and the physical
  Nimiq Pay phone check pass before Phase 0 is approved.
