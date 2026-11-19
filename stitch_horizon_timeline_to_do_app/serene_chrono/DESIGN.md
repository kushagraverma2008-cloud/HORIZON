---
name: Serene Chrono
colors:
  surface: '#fbf8ff'
  surface-dim: '#d7d8f4'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2ff'
  surface-container: '#edecff'
  surface-container-high: '#e6e6ff'
  surface-container-highest: '#dfe0fd'
  on-surface: '#171a2e'
  on-surface-variant: '#464555'
  inverse-surface: '#2c2f44'
  inverse-on-surface: '#f0efff'
  outline: '#767586'
  outline-variant: '#c6c5d7'
  surface-tint: '#474adb'
  primary: '#4143d5'
  on-primary: '#ffffff'
  primary-container: '#5b5fef'
  on-primary-container: '#f9f6ff'
  inverse-primary: '#c0c1ff'
  secondary: '#585d7c'
  on-secondary: '#ffffff'
  secondary-container: '#d6dbff'
  on-secondary-container: '#5a5f7e'
  tertiary: '#904400'
  on-tertiary: '#ffffff'
  tertiary-container: '#b55700'
  on-tertiary-container: '#fff6f2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#05006c'
  on-primary-fixed-variant: '#2c2cc3'
  secondary-fixed: '#dee1ff'
  secondary-fixed-dim: '#c0c4e8'
  on-secondary-fixed: '#141a35'
  on-secondary-fixed-variant: '#404563'
  tertiary-fixed: '#ffdbc8'
  tertiary-fixed-dim: '#ffb689'
  on-tertiary-fixed: '#311300'
  on-tertiary-fixed-variant: '#733500'
  background: '#fbf8ff'
  on-background: '#171a2e'
  surface-variant: '#dfe0fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.005em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  code-xs:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

This design system establishes a focused, hyper-refined workspace engineered for deep work, cognitive calm, and spatial time management. Combining the kinetic velocity of Linear with the serene structural architecture of Notion Calendar, the visual voice is poised, precise, and unobtrusive. 

The aesthetic is Modern Minimalist grounded in tactile utility:
- **Atmospheric Neutrality:** Generous negative space and cool, desaturated undertones eliminate visual clutter, allowing high-density chronological data to breathe.
- **Intentional Chrono-Semantics:** Color is strictly reserved for temporal status, state transitions, and high-leverage actions.
- **Precision Craftsmanship:** Hairline 1px dividers, delicate layered ambient shadows, and dual-radius geometric balance (structural rectilinear cards paired with friction-free interactive pills) create an environment that feels tactile yet lightweight.

## Colors

The palette employs a cool, clinical canvas offset by high-precision semantic signals:

- **Canvas & Surface:**
  - Base Workspace Background: `#F6F7FB` (soft, cool porcelain)
  - Card & Container Surface: `#FFFFFF` (pure white, elevated)
  - Subtle Borders & Separators: `#E8EAF3` (delicate hairline definition)
  - Surface Hover / Active Layer: `#EEF0F8`

- **Typography & Icons:**
  - Text Primary (Titles, focused metrics, critical tasks): `#14172B`
  - Text Secondary (Muted metadata, timestamps, idle shortcuts): `#6B7090`
  - Text Tertiary / Disabled: `#A5A9C2`

- **Primary Accent:**
  - Electric Indigo: `#5B5FEF` (Interactive states, active selections, brand focal points)
  - Electric Indigo Hover: `#4A4DE0`
  - Electric Indigo Subtle (Selection fills, time-block backdrops): `rgba(91, 95, 239, 0.08)`

- **Temporal Urgency Semantics:**
  - **Overdue:** `#EF4444` (Crimson) | Subtle fill: `rgba(239, 68, 68, 0.08)`
  - **Due < 24h:** `#F97316` (Vivid Amber-Orange) | Subtle fill: `rgba(249, 115, 22, 0.08)`
  - **Due < 3 Days:** `#F59E0B` (Warm Ochre) | Subtle fill: `rgba(245, 158, 11, 0.08)`
  - **Later / Scheduled:** `#5B5FEF` (Electric Indigo) | Subtle fill: `rgba(91, 95, 239, 0.08)`
  - **Done / Complete:** `#22C55E` (Leaf Green) | Subtle fill: `rgba(34, 197, 94, 0.08)`

## Typography

The typographic engine uses Inter uniformly across headlines, interface labels, and analytical data to achieve cohesive product telemetry. 

- **Numerical Alignment:** Use tabular figures (`font-variant-numeric: tabular-nums;`) across all timeline intervals, counters, durations, and metadata blocks.
- **Hierarchy through Weight & Color:** Emphasize hierarchy primarily through the transition from Semibold (600) to Medium (500) and color contrast (`#14172B` to `#6B7090`), avoiding oversized headers in multi-pane timeline desktop environments.
- **Micro-Labels:** Use `label-sm` with slight positive tracking (`+0.03em`) and uppercase transformation for date headers, column headers, and temporal section dividers.

## Layout & Spacing

Designed primarily for desktop workflows, the application relies on an asymmetric fixed/fluid hybrid column layout:

- **Structural Composition:**
  - **Left Rail (Navigation & Global Views):** Fixed `240px` compact width.
  - **Primary Timeline Canvas (Day / Week Grid):** Fluid-flex layout spanning the viewport center with strict `1rem` column gutters representing continuous chronological intervals.
  - **Right Inspector / Task Detail Panel:** Fixed `380px` collapsible contextual sheet.
- **Rhythm & Grid:** Built on an absolute `4px` baseline and `8px` spatial increments. Timeline vertical increments use `48px` or `60px` rows (representing 1-hour brackets) with `1px` inner boundary lines.
- **Padding Discipline:** High information density is maintained using `0.5rem` (`8px`) to `0.75rem` (`12px`) interior cell padding, preventing unnecessary spatial inflation while preserving cognitive focus.

## Elevation & Depth

Visual hierarchy leverages a hybrid model of 1px structural hairline borders combined with soft, diffuse, color-tinted ambient shadows. Pure drop shadows are never used in isolation.

- **Level 0 (App Shell / Canvas):** Surface `#F6F7FB`, flat, borderless.
- **Level 1 (Structural Cards & Timeline Columns):** Surface `#FFFFFF`, border `1px solid #E8EAF3`, shadow: `0px 1px 2px rgba(20, 23, 43, 0.03), 0px 4px 12px rgba(20, 23, 43, 0.02)`.
- **Level 2 (Hovered Cards & Dropdown Flyouts):** Surface `#FFFFFF`, border `1px solid #D9DCED`, shadow: `0px 4px 6px -1px rgba(20, 23, 43, 0.05), 0px 10px 24px -4px rgba(91, 95, 239, 0.06)`.
- **Level 3 (Dragged Timeline Blocks, Command Bar & Modals):** Surface `#FFFFFF`, border `1px solid #5B5FEF`, shadow: `0px 12px 32px -4px rgba(20, 23, 43, 0.08), 0px 4px 16px -2px rgba(91, 95, 239, 0.12)`.
- **Timeline Scrims & Glass Layers:** Fixed sticky time-headers use `rgba(255, 255, 255, 0.85)` with `backdrop-filter: blur(12px)` and a bottom border `1px solid #E8EAF3`.

## Shapes

This design system employs a purposeful dual-radius strategy to differentiate between structural canvas architecture and rapid interactive units:

- **Structural Enclosures (Cards, Panels, Modals):** Hard-pinned to `16px` (`rounded-xl` / `1rem`), delivering a stable architectural frame.
- **Interactive Units & Semantic Chips:** Fully rounded pills (`rounded-full` / `9999px`) used for status tags, urgency badges, filter toggles, avatars, and action buttons.
- **Timeline Slots & Micro Elements:** Secondary inner list items and input form fields use `8px` (`rounded-md` / `0.5rem`) to maintain sharp interior edges inside `16px` parent containers.

## Components

### Buttons
- **Primary:** Filled `#5B5FEF`, text `#FFFFFF`, fully rounded pill (`rounded-full`), `h-9` (`36px`), horizontal padding `16px`. Hover: `#4A4DE0` with subtle elevation. Active: scale `0.98`.
- **Secondary / Subtle:** Surface `#FFFFFF`, border `1px solid #E8EAF3`, text `#14172B`. Hover: surface `#F6F7FB`, border `#D9DCED`.
- **Ghost:** Transparent background, text `#6B7090`, rounded `8px`. Hover: background `#EEF0F8`, text `#14172B`.
- **Keyboard Shortcut Hint:** Displayed inline with ghost buttons using `code-xs`, text `#A5A9C2`, background `#F6F7FB`, border `1px solid #E8EAF3`, rounded `4px`, padding `1px 4px`.

### Urgency Chips & Status Pills
- **Geometry:** Height `22px`, pill-shaped (`9999px`), padding `2px 8px`, `label-sm` font.
- **Semantics:**
  - *Overdue:* Background `rgba(239, 68, 68, 0.08)`, text `#EF4444`, border `1px solid rgba(239, 68, 68, 0.2)`.
  - *Due < 24h:* Background `rgba(249, 115, 22, 0.08)`, text `#F97316`, border `1px solid rgba(249, 115, 22, 0.2)`.
  - *Due < 3d:* Background `rgba(245, 158, 11, 0.08)`, text `#D97706`, border `1px solid rgba(245, 158, 11, 0.2)`.
  - *Later:* Background `rgba(91, 95, 239, 0.08)`, text `#5B5FEF`, border `1px solid rgba(91, 95, 239, 0.2)`.
  - *Done:* Background `rgba(34, 197, 94, 0.08)`, text `#16A34A`, border `1px solid rgba(34, 197, 94, 0.2)`.

### Timeline Time-Block Cards
- Surface `#FFFFFF`, radius `16px`, border `1px solid #E8EAF3`, elevation Level 1.
- Left indicator strip: `3px` solid bar carrying the urgency semantic color along the inner left edge.
- Interaction: Drag-and-drop handles appear on hover; duration resize handles on top/bottom edges. Active dragging elevates to Level 3 with cursor `grabbing`.

### Checkboxes
- Size `16px` × `16px`, rounded `4px`.
- Unchecked: Border `1.5px solid #6B7090`, transparent fill. Hover: border `#5B5FEF`.
- Checked: Fill `#22C55E`, border `1.5px solid #22C55E`, white checkmark icon. Strike-through body text transitions smoothly to `#6B7090`.

### Input Fields & Command Bar
- Height `36px`, rounded `8px`, background `#FFFFFF`, border `1px solid #E8EAF3`, text `#14172B`, placeholder `#6B7090`.
- Focus state: Border `1px solid #5B5FEF`, box-shadow `0px 0px 0px 2px rgba(91, 95, 239, 0.15)`. No default browser outlines.
- Global Command Palette (`Cmd+K`): Floating modal, width `580px`, radius `16px`, Level 3 elevation, blur backdrop `rgba(20, 23, 43, 0.2)`.