---
name: Pods
description: Activity-led accountability that makes committed momentum feel visible and social.
colors:
  canvas: "#F3F1E9"
  paper: "#FAF9F4"
  surface: "#FFFDF8"
  ink: "#20241F"
  muted: "#686B64"
  line: "#DCDDD5"
  momentum: "#D9ED72"
  momentum-deep: "#252B24"
  night: "#FA7448"
  night-deep: "#12141C"
  ritual: "#AEB8F0"
  ritual-deep: "#34335A"
  success: "#18795C"
  warning: "#956400"
  danger: "#B42318"
typography:
  activity-display:
    fontFamily: "Mulish Variable, Mulish, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 0.94
    letterSpacing: "-0.055em"
  page-heading:
    fontFamily: "Mulish Variable, Mulish, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Mulish Variable, Mulish, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Mulish Variable, Mulish, system-ui, sans-serif"
    fontSize: "1rem"
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
  control: "14px"
  panel: "20px"
  media: "28px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "14px 18px"
    height: "48px"
  button-activity:
    backgroundColor: "{colors.momentum}"
    textColor: "{colors.momentum-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "14px 18px"
    height: "48px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "14px 16px"
    height: "50px"
  pod-card:
    backgroundColor: "{colors.momentum-deep}"
    textColor: "{colors.surface}"
    rounded: "{rounded.media}"
    padding: "0px"
---

# Design System: Pods

## Overview

**Creative North Star: "Living Momentum"**

Pods is a mobile product used inside Nimiq Pay while someone is deciding what to join, checking what they owe today, or encouraging people already moving with them. The interface should feel like a living activity journal with financial clarity underneath it. Photography and motion create emotional energy. Controls remain familiar, restrained, and easy to operate with one hand.

The system is minimal in content and rich in atmosphere. One screen presents one dominant task. Activity identity earns cinematic media, while account, money, and review screens use the calm neutral shell. Pods rejects crypto casino visuals, generic navy and gold fintech luxury, repetitive card grids, decorative glass, gradient text, and motion without state meaning.

**Key Characteristics:**

- Activity-led media with template-specific art direction.
- Warm neutral account shell with no global blue accent.
- One dominant action and one clear state per screen.
- Progressive disclosure for cadence, commitment, and contract details.
- Familiar mobile navigation, inputs, lists, and chat behavior.
- Motion that confirms navigation, disclosure, sending, and state change.

## Colors

The palette is warm and grounded globally, then becomes committed only inside the active activity context.

### Primary

- **Grounded Ink** (`#20241F`): Global primary actions, selected navigation, body emphasis, and structural controls.
- **Warm Paper** (`#FAF9F4`): Main mobile canvas and calm utility surfaces.

### Secondary

- **Momentum Lime** (`#D9ED72`): Build and creative momentum, live state, and earned completion.
- **Night Run Coral** (`#FA7448`): Fitness and physical intensity.
- **Ritual Lavender** (`#AEB8F0`): Reading, study, and quiet practice.

### Tertiary

- **Verified Green** (`#18795C`): Completed, secured, and approved states only.
- **Review Amber** (`#956400`): Pending review and attention states.
- **Consequence Red** (`#B42318`): Rejection, destructive action, and unrecoverable failure.

### Neutral

- **Canvas Sand** (`#F3F1E9`): Outer background and section rhythm.
- **Surface Ivory** (`#FFFDF8`): Inputs, sheets, list rows, and readable overlays.
- **Quiet Graphite** (`#686B64`): Supporting copy that still meets contrast requirements.
- **Soft Rule** (`#DCDDD5`): Dividers and control outlines.

**The Context Color Rule.** Activity colors never become the global app chrome. They belong to the active Pod, its media, its status, and its action moment.

**The No Blue Rule.** The legacy indigo action system is removed. Blue is not a global button, focus, navigation, or logo color.

## Typography

**Display Font:** Mulish Variable with system sans fallback
**Body Font:** Mulish Variable with system sans fallback
**Label/Mono Font:** Fira Mono with ui-monospace fallback

**Character:** Mulish is direct, human, and easy to scan in a WebView. Fira Mono labels financial and occurrence metadata without making the whole product resemble a terminal.

### Hierarchy

- **Activity Display** (800, 44px, 0.94): Pod names over media and earned outcome moments only.
- **Page Heading** (800, 28px, 1.05): Utility page identity such as Messages, Profile, and My Pods.
- **Title** (800, 18px, 1.2): List groups, conversation names, and next actions.
- **Body** (500, 16px, 1.5): All readable prose and every input, textarea, and select value.
- **Label** (700, 12px, 0.07em, uppercase): Short metadata only. Never use labels for paragraphs.

**The One Headline Rule.** A screen may have one prominent heading. Tabs, cards, and empty states do not compete with it using another oversized slogan.

**The Input Size Rule.** Interactive form text is never smaller than 16px. This prevents iOS focus zoom while preserving user-controlled page zoom.

## Elevation

Pods is layered through media, tonal separation, and overlap. Shadows are ambient and rare. Static list rows remain flat. Floating elevation is reserved for the bottom navigation, chat composer, disclosure sheet, and an active media card.

### Shadow Vocabulary

- **Media Lift** (`0 24px 60px rgba(32,36,31,0.16)`): Featured activity media only.
- **Floating Control** (`0 12px 32px rgba(32,36,31,0.12)`): Bottom navigation, composer, and disclosure sheet.
- **State Focus** (`0 0 0 3px rgba(32,36,31,0.16)`): Keyboard focus and selected controls.

**The Flat By Default Rule.** A surface does not receive a shadow merely because it is rounded. Shadows communicate active elevation or interaction.

## Components

### Buttons

- **Shape:** 14px radius, at least 48px tall, and at least 44px wide.
- **Primary:** Grounded Ink with Surface Ivory text. Full width only when the action truly owns the screen.
- **Activity:** Current activity accent with its matching deep text color.
- **Hover / Focus:** Slight tonal shift, visible 3px focus ring, and a 140ms opacity or transform response.
- **Secondary:** Transparent or Surface Ivory with a Soft Rule outline. Never a second filled accent beside the primary action.

### Chips

- **Style:** Compact filter or status only, 44px minimum touch height when interactive.
- **State:** Grounded Ink selected, transparent unselected. Activity color may identify a non-interactive status.

### Cards / Containers

- **Corner Style:** 28px for media, 20px for sheets, and 14px for controls.
- **Background:** Cards are used only when grouping is necessary. Lists use dividers instead of nested cards.
- **Shadow Strategy:** Flat by default. Media and floating controls may use approved elevation.
- **Internal Padding:** 16px utility, 20px sheet, 24px feature.

### Inputs / Fields

- **Style:** Surface Ivory, Soft Rule stroke, 14px radius, 16px text, and 50px minimum height.
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
- **Do** use transform and opacity for 140 to 240ms state transitions with exponential easing.
- **Do** keep financial, review, and privacy outcomes explicit in text.

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
- **Don't** disable pinch zoom to hide undersized form controls.
