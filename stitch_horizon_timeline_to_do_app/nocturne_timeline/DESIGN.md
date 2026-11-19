---
name: Nocturne Timeline
colors:
  surface: '#101222'
  surface-dim: '#101222'
  surface-bright: '#36384a'
  surface-container-lowest: '#0b0d1d'
  surface-container-low: '#181a2b'
  surface-container: '#1c1e2f'
  surface-container-high: '#27293a'
  surface-container-highest: '#323445'
  on-surface: '#e1e1f8'
  on-surface-variant: '#c6c5d7'
  inverse-surface: '#e1e1f8'
  inverse-on-surface: '#2d2f41'
  outline: '#908fa0'
  outline-variant: '#454555'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#0d00aa'
  primary-container: '#7f84ff'
  on-primary-container: '#0a0096'
  inverse-primary: '#464ada'
  secondary: '#45dfa4'
  on-secondary: '#003825'
  secondary-container: '#00bd85'
  on-secondary-container: '#00452e'
  tertiary: '#ffb783'
  on-tertiary: '#4f2500'
  tertiary-container: '#d97722'
  on-tertiary-container: '#451f00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#05006d'
  on-primary-fixed-variant: '#2c2cc2'
  secondary-fixed: '#68fcbf'
  secondary-fixed-dim: '#45dfa4'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#713700'
  background: '#101222'
  on-background: '#e1e1f8'
  surface-variant: '#323445'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies a serene, midnight-grade productivity atmosphere engineered specifically for long work sessions, focused task planning, and temporal clarity. Built on the visual cues of calm minimalism and modern ambient depth, the interface strips away cognitive overhead, replacing typical task-management clutter with expansive pacing, luminous markers, and structured verticality.

The target audience consists of focused knowledge workers, systems-thinkers, and designers who manage complex, date-driven commitments and find standard light-mode project management tools visually fatiguing. The interface must evoke a sensation of composure, quiet command, and spatial room to breathe. High visual contrast is preserved strictly for critical temporal thresholds (due dates and statuses), while everyday spatial scaffolding settles comfortably into low-luminance navy and charcoal depths.

## Colors

The palette leverages a deep nocturnal spectrum, anchoring the canvas in dark indigo-black foundations to minimize eye strain while allowing luminous semantic accents to direct gaze velocity.

### Base Canvas & Surfaces
- **Canvas Base (`#0E1020`)**: The foundational backdrop of the workspace. Used exclusively behind timeline streams and global page margins.
- **Card / Surface Layer (`#171A2E`)**: Elevated task rows, modular cards, sliding drawers, and toolbars.
- **Surface Highlight (`#1E233D`)**: Hover states, active drag states, and nested subtask enclosures.
- **Border / Divider (`#262A45`)**: Structural dividing rules, card borders, and timeline grid tracks.

### Text & Iconography
- **Primary Text (`#ECEEFF`)**: High-legibility, cool-white tone for task titles, modal headings, and primary metrics.
- **Muted Text (`#8F95B2`)**: De-emphasized metadata, timeline markers, hotkeys, and passive labels.

### Interactive & Brand Accent
- **Electric Indigo (`#6B70FF`)**: The interactive focal point. Applied to active timeline scrubbers, primary actions, selected navigation items, and focus indicators.

### Urgency & Semantic Lifecycle Scale
Temporal indicators rely on high-clarity spectral steps optimized specifically for midnight backdrops:
- **Overdue (`#F87171`)**: Urgent crimson-coral, paired with subtle 10% opacity fills on delinquent timeline entries.
- **Due < 24 Hours (`#FB923C`)**: Radiant amber-orange denoting immediate operational priority.
- **Due < 3 Days (`#FBBF24`)**: Warm sunlight-gold for medium horizon milestones.
- **Due Later (`#818CF8`)**: Calming soft periwinkle-indigo for stable future commitments.
- **Completed / Resolved (`#34D399`)**: Crisp mint emerald for terminal positive satisfaction states.

## Typography

Inter serves as the singular typographic foundation across headlines, functional metrics, and micro-labels. By leaning on Inter's tall x-height and mechanical neutrality, the interface retains clinical precision without appearing cold.

### Hierarchy & Application
- **Headline XL / LG**: Timeline macro intervals (months, quarters, project header views). Rendered in semibold weights with tight negative tracking to compress spatial footprints.
- **Headline MD / SM**: Date nodes (e.g., "Thursday, Oct 24"), active panel titles, and group categorizers.
- **Body LG / MD**: Primary task titles, notes, and timeline card descriptions. Body text avoids pure white to eliminate blooming artifacts over `#171A2E` surfaces.
- **Body SM**: Secondary timeline timestamps, audit trails, and metadata.
- **Label Scale (LG/MD/SM)**: Status badges, keyboard shortcuts, urgency indicators, and button text. `label-sm` utilizes uppercase rendering with intentional letter spacing (`0.04em`) to ensure legibility when set alongside colored status pips.

## Layout & Spacing

The layout is conceived as a persistent, horizontal-scrolling or vertical-stacking timeline continuum framed by stationary command panels.

### Structural Model
- **Master Grid**: Fixed vertical rail for navigation (width: `72px` collapsed or `260px` expanded), paired with a multi-track fluid grid for timeline slots, swimlanes, and calendar columns.
- **Timeline Rhythm**: Standard horizontal day/hour columns align to uniform gutters of `1.5rem` (`24px`).
- **Canvas Margins**: Outer frame borders maintain `2rem` (`32px`) padding on desktop viewports, preserving a generous perimeter that prevents task cards from crowding screen edges.
- **Component Padding Scale**:
  - `space-xs` (`4px`): Micro-offsets, icon-to-badge gaps, tag margins.
  - `space-sm` (`8px`): Internal button padding, pill margins, task list item row gaps.
  - `space-md` (`16px`): Standard card interior padding, input field interiors, task grouping gaps.
  - `space-lg` (`24px`): Structural section spacing, timeline milestone delimiters.
  - `space-xl` (`40px`): Distinct macro-phase divisions along the timeline.

## Elevation & Depth

Depth in this system avoids harsh drop shadows. Instead, hierarchy is conveyed through tonal elevation, hairline micro-borders, and subtle ambient indigo luminance.

### Depth Hierarchy
1. **Level 0 (Canvas Floor - `#0E1020`)**: Passive canvas, timeline grid background rules, and empty state reservoirs.
2. **Level 1 (Card & Content Plane - `#171A2E`)**: Standard task cards, pinned schedule rows, and inspector sidebars. Bound with a continuous `1px` stroke of `#262A45`.
3. **Level 2 (Interactive Floating Surfaces - `#1E233D`)**: Dragged tasks, active hover states, and contextual dropdowns. Elevated with an ambient shadow: `0 8px 32px -4px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(107, 112, 255, 0.15)`.
4. **Level 3 (Modals & Overlays - `#171A2E`)**: Command palette (`⌘K`), temporal range pickers, and deep-focus modals. Elevated with a deep backdrop blur (`backdrop-filter: blur(12px)`) on an underlying `rgba(14, 16, 32, 0.75)` scrim, supported by a dual shadow: `0 20px 50px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px #262A45`.

### Focus & Active State Lighting
Focus rings discard standard browser offsets. Interactive elements receive a crisp `2px` focus halo composed of `#6B70FF` with a diffuse `0 0 16px rgba(107, 112, 255, 0.35)` electric aura.

## Shapes

The interface balances soft structural enclosures with fully organic interactive controls:

- **Cards and Containers**: Set strictly at `16px` (`rounded-2xl` / `1rem`), creating an approachable, high-end architectural envelope that softens dense data streams.
- **Modals & Drawers**: Match the `16px` radius on all exposed corners.
- **Buttons, Tags & Filter Pills**: Fully rounded pill forms (`rounded-full` / `9999px`), contrasting the structural geometry of the timeline cards and signaling instant clickability.
- **Interactive Checkbox Targets**: Subtly softened squares (`6px` border-radius) or circular progress rings to indicate task completion states.

## Components

### Buttons
- **Primary**: Full pill radius (`9999px`). Background `#6B70FF`, text `#FFFFFF`, font `label-lg`. Hover transitions to `#7B80FF` with a subtle luminous glow (`box-shadow: 0 0 20px rgba(107, 112, 255, 0.4)`). Active state scales slightly down (`transform: scale(0.98)`).
- **Secondary / Ghost**: Full pill radius. Background `transparent`, border `1px solid #262A45`, text `#ECEEFF`. Hover shifts background to `#1E233D` and border to `#6B70FF`.
- **Destructive**: Full pill radius. Background `rgba(248, 113, 113, 0.12)`, border `1px solid rgba(248, 113, 113, 0.25)`, text `#F87171`.

### Urgency Chips & Status Pills
- Pill-shaped (`9999px`), compact height (`24px`), horizontal padding `10px`.
- Built with a dual-layer approach: a 12% tint background of the respective urgency token, a `1px` border at 25% opacity, text in full-intensity token color, accompanied by a `6px` solid status pip on the left margin.
  - *Overdue*: Background `rgba(248, 113, 113, 0.12)`, text `#F87171`.
  - *< 24h*: Background `rgba(251, 146, 60, 0.12)`, text `#FB923C`.
  - *< 3 Days*: Background `rgba(251, 191, 36, 0.12)`, text `#FBBF24`.
  - *Later*: Background `rgba(99, 102, 241, 0.12)`, text `#818CF8`.
  - *Done*: Background `rgba(52, 211, 153, 0.12)`, text `#34D399`.

### Timeline Cards
- Background `#171A2E`, corner radius `16px`, border `1px solid #262A45`.
- Internal padding `space-md` (`16px`).
- Hover shifts card border to `#343B61` with subtle vertical translation (`translateY(-1px)`).
- Left-edge indicator: Tasks feature an optional `3px` inset indicator strip corresponding to urgency color.
- Drag-and-drop state: Elevates to `#1E233D`, rotation `1deg`, shadow `0 14px 40px -8px rgba(0, 0, 0, 0.55), 0 0 0 1px #6B70FF`.

### Checkboxes & Task Completion Controls
- Standard uncompleted state: Circle or `6px` softened square, width and height `20px`, border `2px solid #262A45`, background `transparent`.
- Hover state: Border illuminates to `#6B70FF`.
- Completed state: Background fills `#34D399`, border `#34D399`, containing an inner `#0E1020` checkmark. The associated card title drops to `#8F95B2` with a clean strikethrough transition.

### Input Fields & Quick-Add Bars
- Height `44px`, corner radius `12px` (or full pill for global search).
- Background `#171A2E`, border `1px solid #262A45`, text `#ECEEFF`, placeholder `#8F95B2`.
- Focus state: Border transitions to `#6B70FF` with electric outer bloom; zero layout shift.

### Timeline Track & Scrub Line
- Vertical/horizontal axis rules rendered in `1px solid #262A45`.
- Current time indicator: A distinct, illuminated laser line in `#6B70FF` terminating in a `10px` pulsing beacon node (`box-shadow: 0 0 12px #6B70FF`).