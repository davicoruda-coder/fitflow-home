---
name: FitFlow Home
description: Calm home-circuit UI — short sessions, clear cues, light/dark green & ember accents
colors:
  canopy-green: "#127a52"
  canopy-green-dark: "#2fd18a"
  mist-mint: "#d3efe3"
  mist-mint-dark: "#163528"
  ember-orange: "#e85d04"
  ember-orange-dark: "#ff7a2f"
  ember-soft: "#ffe4d1"
  ember-soft-dark: "#3a2214"
  ink: "#101814"
  ink-dark: "#e8efe9"
  moss-muted: "#5a6b62"
  moss-muted-dark: "#9aafa3"
  paper: "#e9eeea"
  paper-dark: "#0b100e"
  elevated: "#ffffff"
  elevated-dark: "#151c19"
  line: "#cdd6d0"
  line-dark: "#2a3631"
  danger: "#c0392b"
  danger-dark: "#ff6b5a"
  on-accent: "#ffffff"
  on-accent-dark: "#06140e"
typography:
  display:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.14em"
rounded:
  lg: "0.75rem"
  xl: "1rem"
  "2xl": "1.1rem"
  "3xl": "1.5rem"
  full: "9999px"
spacing:
  card-pad: "1rem"
  section: "2rem"
  page-x: "1.5rem"
  page-y: "2rem"
  control-h: "3rem"
  cta-h: "3.5rem"
components:
  button-primary:
    backgroundColor: "{colors.canopy-green}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.2xl}"
    padding: "0 1.5rem"
    height: "{spacing.cta-h}"
  button-primary-dark:
    backgroundColor: "{colors.canopy-green-dark}"
    textColor: "{colors.on-accent-dark}"
    rounded: "{rounded.2xl}"
    padding: "0 1.5rem"
    height: "{spacing.cta-h}"
  chip:
    backgroundColor: "{colors.mist-mint}"
    textColor: "{colors.canopy-green}"
    rounded: "{rounded.2xl}"
    padding: "0.5rem 0.75rem"
  chip-energy:
    backgroundColor: "{colors.ember-soft}"
    textColor: "{colors.ember-orange}"
    rounded: "{rounded.full}"
    padding: "0.25rem 0.75rem"
  surface-card:
    backgroundColor: "{colors.elevated}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "{spacing.card-pad}"
  input:
    backgroundColor: "{colors.elevated}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "0 1rem"
    height: "{spacing.control-h}"
---

# Design System: FitFlow Home

## Overview

**Creative North Star: "The Calm Home Circuit"**

FitFlow Home looks like a focused training studio that lives in your pocket: quiet surfaces, one strong green voice for action, and a warm ember accent for rest/energy moments — never a flashy gym marketing page. Density stays comfortable for phone thumbs (large tap targets, short copy) while desktop opens into a side-rail + two-column operate layout without inventing a second brand.

The system is intentionally lean: solid elevated panels, hairline borders, soft ambient glows on the page background, and motion that is short and purposeful (page enter, rest pulse, button press). Light and dark themes share the same roles; only values shift.

**Key Characteristics:**
- Operate-mode product UI (tasks over spectacle)
- Dual-theme green primary + ember secondary
- Sora display + Manrope body
- Large rounded controls (≈1.1rem+) and min-height 48–56px
- Mobile bottom nav / desktop side rail

## Colors

A forest-canopy primary with a warm ember secondary on cool paper/ink neutrals — calm enough for daily use, energetic enough for “go train.”

### Primary
- **Canopy Green** (`#127a52` light / `#2fd18a` dark): primary actions (Começar, salvar), active nav chip, accent labels, streak chip. Soft companion **Mist Mint** (`#d3efe3` / `#163528`) for chip fills and success soft panels.
- **On-accent** (`#ffffff` / `#06140e`): text/icons on primary buttons.

### Secondary
- **Ember Orange** (`#e85d04` / `#ff7a2f`): rest-day signals, energy labels, auth eyebrow chip, caution confirm panels. Soft companion (`#ffe4d1` / `#3a2214`).

### Neutral
- **Paper** (`#e9eeea` / `#0b100e`): page background.
- **Elevated** (`#ffffff` / `#151c19`): cards, panels, inputs.
- **Ink** (`#101814` / `#e8efe9`): primary text.
- **Moss Muted** (`#5a6b62` / `#9aafa3`): secondary text.
- **Line** (`#cdd6d0` / `#2a3631`): borders and dividers.
- **Danger** (`#c0392b` / `#ff6b5a`): destructive actions and errors.

### Named Rules
**The One Canopy Rule.** Primary green drives CTAs and active state; don’t introduce a third brand hue. Ember is reserved for rest/energy/caution, not competing primary buttons.

**The Soft Companion Rule.** Accent text sits on its soft tint (`accent-soft` / `energy-soft`), never raw neon on paper.

## Typography

**Display Font:** Sora (system-ui fallback)  
**Body Font:** Manrope (system-ui fallback)

**Character:** Sora carries confident, slightly geometric headlines; Manrope keeps body and UI labels readable and friendly. Pairing feels modern-home, not sports-broadcast.

### Hierarchy
- **Display** (Sora 600, ~30–36px, tight tracking): “Olá, …”, page titles.
- **Headline / Title** (Sora 600, ~20–24px): workout titles, section heads.
- **Body** (Manrope 400–500, 14–16px): cues, descriptions, form helper text.
- **Label** (Manrope 600, ~11–12px, uppercase, wide tracking ~0.14em): section eyebrows (“DIA DE DESCANSO”, “TREINO DO DIA”).

### Named Rules
**The Cue Clarity Rule.** Exercise guidance is body-size muted text under the title — never decorative display type competing with the exercise name.

## Layout

- **Mobile:** single column, `max-w-lg` shell, page padding `px-6 py-8`, bottom nav with safe-area. Content stacks: header → primary card/CTA → lists.
- **Desktop (≥1024px):** `max-w-6xl`–`7xl` shell with **side rail** (~14–15rem) + scrollable main panel (`rounded-[1.75rem]`). Hoje / Histórico use **two columns** (action/context | lists or metrics | logs).
- **Session (`/treino`):** media + meta in a two-column grid on large screens; nav hidden for focus.
- **Rhythm:** section gaps ~2rem; card padding ~1rem; primary CTAs full-width on mobile, often `max-w-xs` on desktop.
- **Touch:** controls `min-h-12`–`min-h-14` (48–56px).

## Elevation & Depth

Mostly **tonal + border**, not heavy shadow stacks. Depth comes from elevated surfaces on paper, 1px line borders, a light top edge highlight on cards, and a soft panel drop shadow on the main shell.

### Shadow Vocabulary
- **Panel** (`0 18px 48px -28px` ink-tinted / stronger in dark): outer app shell.
- **Primary button glow** (`0 10px 24px -14px` accent): CTA lift only.
- **Card** (`0 1px 0` subtle ink mix): hairline lift, not float.

### Named Rules
**The Flat-By-Default Rule.** Cards stay flat (border + elevated fill). Don’t add multi-layer soft UI shadows or glass blur on desktop — solid fills for performance and clarity.

## Shapes

- Base radius token `--radius: 1.1rem` (~17.6px).
- Common utilities: `rounded-xl` (inputs), `rounded-2xl` (cards, buttons, chips), `rounded-3xl` (large rest/media panels), `rounded-full` (weekday pills, some chips).
- Media thumbs and exercise video frames: rounded squares / `rounded-3xl` for session media.
- Confirm panels and errors: same soft rounded language as cards.

## Components

### Buttons
- **Shape:** generously rounded (`rounded-2xl`).
- **Primary (`.btn-primary`):** canopy fill, on-accent text, soft accent glow; hover brightness; active scale `0.98`.
- **Secondary / outline:** elevated fill + line border; danger variant uses danger border/text.
- **Text/ghost (session):** muted underline link style for lower-priority exits (still confirmed when destructive).

### Chips
- **Accent chip:** mist mint fill, canopy text, soft accent border — active nav, streak.
- **Energy chip:** ember soft fill, ember text — rest/auth labels.

### Cards / Containers
- **`.surface-card`:** elevated bg, line border, `rounded-2xl`, light edge shadow.
- **`.surface-panel`:** app shell; larger radius on desktop; solid elevated (no blur).
- Internal padding typically `p-4`–`p-6`.

### Inputs / Fields
- Elevated background, line border, `rounded-xl`, `min-h-12`, horizontal padding `px-4`.
- Disabled fields use muted text on slightly quieter background.
- Errors via danger banner (border + soft danger fill), not only red text.

### Navigation
- **Mobile:** fixed bottom bar, three equal links; active = chip treatment.
- **Desktop:** left rail with brand wordmark, vertical links, same active chip; short tagline at bottom.
- Hidden during `/treino`.

### Confirm action
- Destructive or early-exit flows expand inline: titled panel, cancel + confirm; danger (red) or caution (ember) variants.

### Named Rules
**The Confirm Drastic Rule.** Logout, reset, and mid-session abandon always require an explicit second step — never one-tap destroy.

## Do's and Don'ts

### Do:
- **Do** keep primary CTAs canopy green and large enough for thumbs (`min-h-14` when primary).
- **Do** use ember for rest/energy/caution — not as a second primary CTA color.
- **Do** preserve light/dark token pairs when adding surfaces.
- **Do** prefer solid elevated panels on desktop (performance + clarity).
- **Do** keep exercise names readable (allow 2 lines) beside thumbs.

### Don't:
- **Don't** introduce purple/indigo “AI default” palettes or cream+terracotta editorial clichés foreign to this canopy/ember system.
- **Don't** add glassmorphism / heavy backdrop-blur back onto cards or the side rail.
- **Don't** inflate the UI with dashboard chrome, stat strips, or marketing hero overlays inside the operate app shell.
- **Don't** skip confirmation on destructive actions.
- **Don't** invent a third accent hue for “variety.”
