---
name: Pods
description: Activity-led accountability that makes committed momentum feel visible and social.
colors:
  canvas: "#F8F9F5"
  paper: "#FEFFF9"
  surface: "#F1F3EF"
  ink: "#1D211D"
  muted: "#687069"
  momentum: "#D9ED72"
  momentum-soft: "#F1F7CF"
  fitness: "#F2A84A"
  reading: "#D9A6B8"
  study: "#69BDB2"
  create: "#82ABD4"
  success: "#2A725B"
  warning: "#A36C24"
  danger: "#A34A42"
typography:
  activity-display:
    fontFamily: "Mulish Variable, Mulish, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 800
    lineHeight: 0.94
    letterSpacing: "-0.055em"
  page-heading:
    fontFamily: "Mulish Variable, Mulish, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Mulish Variable, Mulish, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Mulish Variable, Mulish, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Fira Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.07em"
rounded:
  control: "16px"
  panel: "22px"
  row: "18px"
  media: "30px"
  pill: "999px"
spacing:
  micro: "6px"
  control: "12px"
  card: "14px"
  inset: "20px"
  group: "24px"
  section: "32px"
  hero: "40px"
components:
  button-primary:
    backgroundColor: "{colors.momentum}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "16px 18px"
    height: "56px"
  button-activity:
    backgroundColor: "{colors.momentum}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "16px 18px"
    height: "56px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "14px 16px"
    height: "52px"
  decision-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.media}"
    padding: "18px"
    boxShadow: "0 18px 48px -24px rgba(29,33,29,.20), 0 5px 14px -10px rgba(29,33,29,.12)"
---

# Design System: Pods

## Overview

**Creative North Star: "Living Momentum"**

Pods is a mobile product used inside Nimiq Pay while someone is deciding what to join, checking what they owe today, or encouraging people already moving with them. The interface should feel like a living activity journal with financial clarity underneath it. Photography and motion create emotional energy. Controls remain familiar, restrained, and easy to operate with one hand.

The system is minimal in content and rich in atmosphere. One screen presents one dominant task. Activity identity earns cinematic media, while account, money, and review screens use a visually white shell. The off-black entry is the only globally dark scene. Pods rejects crypto casino visuals, generic navy and gold fintech luxury, repetitive card grids, decorative glass, gradient text, visible separator-line layouts, and motion without state meaning.

**Key Characteristics:**

- Activity-led media with template-specific art direction.
- Visually white account shell with no washed beige overlay and no global blue accent.
- One dominant action and one clear state per screen.
- Progressive disclosure for cadence, commitment, and contract details.
- Familiar mobile navigation, inputs, lists, and chat behavior.
- Motion that confirms navigation, disclosure, sending, and state change.

## Colors

The palette is bright and assured globally, then becomes contextual only inside the active activity.

### Primary

- **Grounded Ink** (`#1D211D`): Global structure, text, and dark action details.
- **Momentum Lime** (`#D9ED72`): Global primary actions and selected decisions.
- **Visual White** (`#FEFFF9`): Raised surfaces within the authenticated mobile shell.

### Secondary

- **Fitness Orange** (`#F2A84A`): Physical intensity and movement context.
- **Reading Rose** (`#D9A6B8`): Reading and reflective context.
- **Study Teal** (`#69BDB2`): Focus and learning context.
- **Create Blue** (`#82ABD4`): Practice and creative work context.

### Tertiary

- **Verified Green** (`#2A725B`): Completed, secured, and approved states only.
- **Review Amber** (`#A36C24`): Pending review and attention states.
- **Consequence Red** (`#A34A42`): Rejection, destructive action, and unrecoverable failure.

### Neutral

- **Canvas White** (`#F8F9F5`): Authenticated mobile canvas.
- **Raised White** (`#FEFFF9`): Decision and financial cards.
- **Soft Surface** (`#F1F3EF`): Inputs, grouped controls, and restrained status backgrounds.
- **Quiet Graphite** (`#687069`): Supporting copy that still meets contrast requirements.

**The Context Color Rule.** Activity colors never become the global app chrome. They belong to the active Pod, its media, its status, and its action moment.

**The No Blue Rule.** The legacy indigo action system is removed. Blue is not a global button, focus, navigation, or logo color.

## Typography

**Display Font:** Mulish Variable with system sans fallback
**Body Font:** Mulish Variable with system sans fallback
**Label/Mono Font:** Fira Mono with ui-monospace fallback

**Character:** Mulish is direct, human, and easy to scan in a WebView. Fira Mono labels financial and occurrence metadata without making the whole product resemble a terminal.

### Hierarchy

- **Outcome Display** (800, 40px/40px): Money and terminal outcomes only.
- **Screen Heading** (800, 30px/31px): One route identity.
- **Section Heading** (800, 22px/25px): A major content group.
- **Card Title** (800, 16px/21px): Decisions and next actions.
- **Body** (500, 14px/20px): Readable prose. Interactive form values remain at least 16px.
- **Supporting** (600, 12px/17px): Secondary context.
- **Metadata** (700, 10px/13px, uppercase): Compact occurrence and financial labels only.

**The One Headline Rule.** A screen may have one prominent heading. Tabs, cards, and empty states do not compete with it using another oversized slogan.

**The Input Size Rule.** Interactive form text is never smaller than 16px. This prevents iOS focus zoom while preserving user-controlled page zoom.

## Elevation

Pods is layered through white space, activity media, and restrained elevation. Raised decision and financial cards use one diffuse tinted shadow. Static text groups remain unboxed. Cards never touch and are never nested.

### Shadow Vocabulary

- **Raised Card** (`0 18px 48px -24px rgba(29,33,29,0.20), 0 5px 14px -10px rgba(29,33,29,0.12)`): Decision and financial cards.
- **Floating Control** (`0 12px 32px rgba(29,33,29,0.12)`): Bottom navigation, composer, and disclosure sheet.
- **State Focus** (`0 0 0 3px rgba(29,33,29,0.20)`): Keyboard focus and selected controls.

**The Negative Space Rule.** Do not introduce a card where spacing and typography are enough.

## Components

### Buttons

- **Shape:** 16px radius, at least 48px tall, and at least 44px wide.
- **Primary:** Momentum Lime with Grounded Ink text. Full width only when the action truly owns the screen.
- **Activity:** Current activity accent with Grounded Ink text.
- **Hover / Focus:** Slight tonal shift, visible 3px focus ring, and a 140ms opacity or transform response.
- **Secondary:** Soft Surface or transparent. Never a second filled accent beside the primary action.

### Chips

- **Style:** Compact filter or status only, 44px minimum touch height when interactive.
- **State:** Momentum Lime selected, transparent unselected. Activity color may identify a non-interactive status.

### Cards / Containers

- **Corner Style:** 30px for media, 22px for decision and financial cards, 18px for rows, and 16px for controls.
- **Background:** Cards are used only when grouping or decision hierarchy is necessary. Visible separator-line layouts are not used.
- **Shadow Strategy:** Use the single Raised Card shadow. Never stack elevated cards.
- **Internal Padding:** 18px card, 20px screen inset, and 24px feature.
- **Spacing:** 14px between cards, at least 24px before a fixed action dock, and at least 116px scroll clearance behind the dock.

### Inputs / Fields

- **Style:** Raised White or Soft Surface, no decorative stroke, 16px radius, 16px text, and 52px minimum height.
- **Focus:** Grounded Ink border and State Focus ring. Never remove focus without an equivalent.
- **Error / Disabled:** Consequence Red plus a text explanation. Disabled state keeps readable contrast.

### Navigation

- Bottom navigation contains Today, Discover, My Pods, and Messages.
- The active destination uses Grounded Ink, a restrained tonal background, and no legacy blue marker.
- Pod navigation is compact and horizontally scrollable only when all sections are necessary. Chat rooms prefer a back button plus a single context control over five persistent tabs.
- Onboarding uses three small progress dots with accessible text announced separately, not three heavy tab pills.

### Activity Pod Card

- The default card shows activity-specific media, Pod name, relationship status, and one relevant action.
- A 44px information control reveals commitment, cadence, dates, group size, and frozen rules in an animated bottom sheet or inline expansion.
- Different templates use distinct images. Build, Practice, Fitness, Reading, and Study never collapse into the same three thumbnails.

### Conversation Surface

- Conversation lists open immediately without a marketing hero.
- A Pod room uses a compact media identity header, message timeline, and fixed composer.
- The composer uses 16px text and 44px controls. Proof, invitation, and attachment actions live in one contextual action sheet.

## Do's and Don'ts

### Do:

- **Do** lead each route with the user's next meaningful action.
- **Do** preserve activity-specific photography and theme accents.
- **Do** use 16px text in every form control and 44px interactive targets.
- **Do** reveal contract details progressively through a clear information control.
- **Do** give all five templates distinct visual identities.
- **Do** use transform and opacity with the approved scale: 140ms press, 220ms selection, 280ms sheet, 320ms screen, 420ms progression, and 520ms completion.
- **Do** keep financial, review, and privacy outcomes explicit in text.
- **Do** validate fluid portrait widths from 320px through 430px, keyboard-open states, safe areas, text scaling, and a functional landscape fallback.

### Don't:

- **Don't** use the legacy indigo action color, blue focus rings, or blue active navigation.
- **Don't** imitate Moonwalk or frame Pods as fitness-only.
- **Don't** use crypto casino visuals, neon-on-black dashboards, speculative language, or fake urgency.
- **Don't** use generic navy-and-gold fintech luxury.
- **Don't** use repetitive card grids, decorative glass, gradient text, or motion without state meaning.
- **Don't** expose internal enum names or contradict participant state across routes.
- **Don't** repeat a progress label as the screen eyebrow or repeat a heading in its supporting copy.
- **Don't** place oversized campaign slogans on Profile, Messages, My Pods, or other task screens.
- **Don't** make every section a rounded card or nest cards inside cards.
- **Don't** use visible separator-line layouts or let two raised cards touch.
- **Don't** disable pinch zoom to hide undersized form controls.
