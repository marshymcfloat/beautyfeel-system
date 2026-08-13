# Beautyfeel Design System

This document is the visual and interaction standard for every Beautyfeel
customer, owner, and staff interface. New UI must follow it unless this file is
deliberately revised first.

## 1. Design direction

Beautyfeel should feel calm, capable, clean, and personal. The interface combines
the reference design's restrained teal, clear hierarchy, compact controls, soft
surfaces, and data legibility with warmer neutrals appropriate for a beauty and
wellness business.

The customer experience should feel unhurried and reassuring. The owner and
staff experience should feel efficient and operational. Both use the same visual
language, but not the same density.

Design principles:

1. Make the next action unmistakable.
2. Prefer whitespace and grouping over excessive cards.
3. Use teal for action and selection, not decoration everywhere.
4. Show status with text and shape as well as color.
5. Keep mobile layouts comfortable for one-handed use.
6. Make schedules, prices, deposits, and booking states easy to scan.
7. Use motion only to explain a state change.

## 2. Visual character

The reference aesthetic is accepted with these Beautyfeel adjustments:

- Keep the deep teal identity and off-white surfaces.
- Replace sterile blue-gray page backgrounds with a warm mineral neutral.
- Replace pure black with a softer ink color.
- Tone down green, yellow, and red so status colors do not compete with the
  primary brand color.
- Use fewer dashboard cards. Related rows should often share one surface with
  dividers.
- Use beauty imagery only on public brand surfaces, never as dashboard filler.
- Avoid overly feminine visual clichés such as pink gradients, script fonts,
  floral decoration, gold foil, or excessive softness.

Beautyfeel is modern wellness, not clinical software and not a luxury-cosmetics
template.

## 3. Color system

### Brand and neutral tokens

| Token | Value | Use |
|---|---:|---|
| `--color-brand-950` | `#0E3435` | Deep emphasis and high-contrast brand surfaces |
| `--color-brand-900` | `#174E4F` | Primary buttons, selected navigation, key charts |
| `--color-brand-800` | `#206263` | Hover state on light backgrounds |
| `--color-brand-100` | `#DCE9E6` | Selected rows, tags, quiet highlights |
| `--color-brand-50` | `#EFF6F4` | Subtle brand-tinted background |
| `--color-canvas` | `#F4F3EF` | Application background |
| `--color-surface` | `#FFFEFB` | Cards, sheets, inputs, navigation |
| `--color-surface-muted` | `#ECEBE6` | Disabled and secondary regions |
| `--color-border` | `#DDDDD6` | Standard borders and dividers |
| `--color-border-strong` | `#C8C9C2` | Emphasized boundaries |
| `--color-ink` | `#172322` | Primary text; never use pure black |
| `--color-ink-muted` | `#5F6B68` | Secondary text |
| `--color-ink-subtle` | `#87918E` | Metadata and placeholders |
| `--color-on-brand` | `#FFFFFF` | Content on brand surfaces |

### Semantic tokens

| Token | Value | Use |
|---|---:|---|
| `--color-success` | `#2F7D5B` | Confirmed, completed, available |
| `--color-success-soft` | `#E4F1E9` | Success background |
| `--color-warning` | `#B47B18` | Awaiting payment, staffing attention |
| `--color-warning-soft` | `#F8EED8` | Warning background |
| `--color-danger` | `#B84A4A` | Rejected, cancelled, destructive actions |
| `--color-danger-soft` | `#F7E5E3` | Danger background |
| `--color-info` | `#47758A` | Neutral information |
| `--color-info-soft` | `#E5EFF3` | Information background |

Semantic colors do not replace the brand accent. They appear only where status
has meaning. Never communicate state using color alone.

### Color usage

- Maintain a minimum WCAG AA contrast ratio of 4.5:1 for normal text.
- Primary buttons use brand teal with white text.
- Secondary buttons use a surface background, border, and ink text.
- Destructive buttons use danger color only at the final confirmation point.
- Page backgrounds use `canvas`; content surfaces use `surface`.
- Avoid gradients, neon color, outer glows, and large saturated backgrounds.
- Dark mode is out of scope for v1. Do not infer it from system preference.

## 4. Typography

Use **Inter Tight** through `next/font/google`. It is the only UI and brand
typeface. Use tabular numerals for prices, dates, times, deposits, and metrics.

| Style | Mobile | Desktop | Weight | Line height | Tracking |
|---|---:|---:|---:|---:|---:|
| Display | 36px | 48px | 600 | 1.05 | -0.035em |
| Heading 1 | 30px | 36px | 600 | 1.12 | -0.025em |
| Heading 2 | 24px | 28px | 600 | 1.18 | -0.02em |
| Heading 3 | 18px | 20px | 600 | 1.3 | -0.01em |
| Body large | 17px | 18px | 400 | 1.55 | 0 |
| Body | 16px | 16px | 400 | 1.5 | 0 |
| Label | 14px | 14px | 600 | 1.4 | 0.005em |
| Caption | 12px | 12px | 500 | 1.4 | 0.01em |

Rules:

- Use sentence case for headings, buttons, tabs, and labels.
- Never use all caps for navigation or section headings.
- Limit public-page paragraphs to 60 characters per line.
- Use weight 600 for emphasis; reserve 700 for exceptional numeric emphasis.
- Do not use thin weights below 400.
- Do not reduce form controls below 16px on mobile.

## 5. Spacing, layout, and density

Use a 4px base grid.

```text
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
```

### Mobile

- Design at 375px first and support down to 320px.
- Page gutter: 16px; use 20px on larger phones when space permits.
- Vertical section spacing: 32px for app pages and 48px for public pages.
- Stack primary content in one column.
- Keep the primary action visible near the bottom when a step requires a clear
  continuation, accounting for safe-area insets.
- Minimum interactive target: 44 by 44px; preferred primary button height: 52px.
- Never introduce horizontal page scrolling.

### Tablet and desktop

- Public content maximum width: 1200px.
- Portal content maximum width: 1440px.
- Public pages may use asymmetric 5/7 or 7/5 grids.
- Portal pages use a fixed sidebar above 1024px and role-specific bottom
  navigation below 768px.
- Data regions may become two-column layouts, but forms remain comfortably
  narrow at 640px maximum.

### Density by context

- Customer booking: low density, one decision per section.
- Owner dashboard: medium density, optimized for scanning and action.
- Staff schedule: medium-low density, emphasizing time and customer details.

## 6. Shape, borders, and elevation

| Element | Radius |
|---|---:|
| Small tags and controls | 8px |
| Inputs and buttons | 12px |
| Cards and panels | 16px |
| Large public media | 24px |
| Pills | 999px, only for status and compact filters |

- Standard border: 1px solid `--color-border`.
- Prefer borders and negative space over shadows.
- Standard raised surface shadow:
  `0 10px 30px -18px rgba(14, 52, 53, 0.22)`.
- Modal and sheet shadow:
  `0 24px 64px -28px rgba(14, 52, 53, 0.34)`.
- Do not apply shadows to every card.
- Do not nest multiple rounded cards unless each level has a distinct function.

## 7. Core components

### Buttons

- Primary: solid teal, white text, 52px mobile height.
- Secondary: surface, visible border, ink text.
- Tertiary: text or quiet tinted background.
- Destructive: danger treatment only after intent is established.
- Icon-only buttons require an accessible label and 44px target.
- Pressed state uses `transform: scale(0.98)`.
- Disabled state remains legible and uses both opacity and cursor/state changes.

### Form controls

- Labels always sit above fields.
- Input height: 52px on customer pages; 44–48px in portal tables and filters.
- Helper and error text appear below the field without shifting unrelated UI.
- Phone inputs visibly use the Philippine `+63` context.
- Dates and times use human-readable Manila time.
- Focus rings use a 2px brand outline with a 2px offset.
- Never use placeholder text as the only label.

### Cards and grouped surfaces

- Cards group one coherent task or concept.
- Use section headings, whitespace, and dividers for related list content.
- Avoid rows of identical metric cards when a compact summary strip is clearer.
- Selected service and slot cards use a border, soft teal fill, and check icon.
- Booking summaries remain visible before any commitment or payment action.

### Status badges

- Use compact rounded rectangles, not decorative pills everywhere.
- Include a text label and optional small icon.
- Canonical labels:
  `Awaiting payment`, `Payment sent`, `Confirmed`, `Staffing required`,
  `Completed`, `No-show`, `Cancelled`, `Expired`, and `Rejected`.
- Do not expose `FLEX_RESERVED` or other internal enum names to customers.

### Navigation

- Public mobile header: brand, one booking action, and compact menu.
- Booking flow: back control, Beautyfeel mark, and explicit step indicator.
- Owner mobile navigation: Today, Calendar, Bookings, Alerts, More.
- Staff mobile navigation: Today, Schedule, Account.
- Desktop portal: persistent left sidebar with the active item shown by a teal
  surface rather than a thin indicator alone.

### Tables and lists

- Desktop tables may use columns; mobile converts each row into a structured
  list item, never a horizontally compressed table.
- Keep the most important identifier and status visible first.
- Place row actions in a menu unless one action is clearly primary.
- Use sticky headers only when lists are long enough to justify them.

### Date and slot controls

- Date selection uses a horizontally scrollable short date rail on mobile.
- Time slots use a two- or three-column grid depending on viewport width.
- Unavailable slots are omitted rather than presented as tappable disabled
  controls, unless showing business hours requires their context.
- Selected date and time must remain visible in the booking summary.

## 8. Page composition patterns

### Public pages

- Use editorial whitespace and high-quality treatment imagery.
- Prefer asymmetrical text-and-image compositions on desktop.
- Collapse to a direct single-column story on mobile.
- Keep one dominant call to action per viewport.
- Images should show real services, spaces, hands, and treatment details with
  natural light. Avoid generic model portraits and stock-photo collages.

### Guided booking pages

```text
Compact header
Step indicator
Page title and one-sentence guidance
Primary decision area
Persistent booking summary when useful
Back and continue actions
```

- Each page asks for one category of decision.
- Preserve selections through URL state or authoritative server state.
- Confirm price, deposit, date, time, and policy before creating the hold.

### Owner dashboard

```text
Greeting and current date
Urgent operational summary
Today's chronological schedule
Pending payments
Staffing-required bookings
Secondary insights
```

- Prioritize work requiring action over analytics.
- Charts are optional and must answer a real business question.
- Do not imitate the reference dashboard's exam analytics merely for visual
  similarity.

### Staff pages

- Lead with the next assigned appointment.
- Make customer name, service, time, and status immediately scannable.
- Completion and no-show actions appear only when operationally relevant.
- Do not expose owner-only financial or staffing controls.

## 9. Data visualization

- Use charts only for trends such as booking volume, revenue, no-shows, or
  service demand.
- Primary series uses brand teal.
- Secondary comparison uses muted teal-gray.
- Semantic colors appear only for meaningful thresholds.
- Directly label important values; do not rely exclusively on legends.
- Always provide an accessible textual summary or table.
- Avoid 3D charts, decorative gauges, excessive donut charts, and dense grid
  decoration.

## 10. Motion and feedback

Motion level is restrained: 3 out of 10.

- Standard transition: 160ms for hover/press and 220ms for panels.
- Use `cubic-bezier(0.16, 1, 0.3, 1)`.
- Animate only opacity and transform.
- No perpetual animations, magnetic buttons, parallax, or scroll hijacking.
- Skeletons may use a subtle shimmer that respects reduced motion.
- Realtime refreshes should update quietly without flashing the whole page.
- Success feedback should be immediate, specific, and persistent long enough to
  understand.
- Respect `prefers-reduced-motion` and remove nonessential transitions.

## 11. Loading, empty, error, and conflict states

Every data surface must define all four states.

- Loading: dimension-matched skeletons, never a page-level spinner.
- Empty: explain what is absent and provide the relevant next action.
- Error: plain-language cause, safe retry, and no raw server message.
- Conflict: explain that availability changed and return the customer to fresh
  slots without losing selected services or customer details.
- Offline/reconnecting: show a quiet banner; never claim current availability
  until the server refresh succeeds.

## 12. Accessibility

- Meet WCAG 2.2 AA.
- Provide visible keyboard focus on every control.
- Preserve logical heading order and landmark structure.
- Use native controls before custom widgets.
- Dialogs trap focus, close with Escape, and restore focus to the trigger.
- Announce form errors, booking results, and live status changes appropriately.
- Never rely on swipe, hover, color, or icons as the only interaction cue.
- Support 200% text zoom without clipped content or horizontal scrolling.

## 13. Iconography and imagery

- Use one outline icon family throughout the application.
- Use 1.75px or 2px stroke weight consistently.
- Icons support labels; they do not replace unfamiliar actions.
- No emoji in navigation, buttons, statuses, empty states, or alerts.
- Optimize raster images with `next/image`, correct `sizes`, and meaningful alt
  text. Decorative images use empty alt text.

## 14. Content style

- Use clear, calm, concise English suitable for Philippine customers.
- Use `GCash`, `mobile number`, `appointment`, and `deposit` consistently.
- Prefer concrete actions: `Choose a time`, `Send deposit`, `Confirm payment`.
- Explain the 20% deposit before the customer submits their details.
- Avoid luxury clichés and vague phrases such as “elevate your beauty.”
- Dates use `9 August 2026`; times use `9:30 AM` with Manila context where needed.
- Currency uses `₱1,250.00` and tabular numerals.

## 15. Responsive and implementation rules

- Server Components remain the default.
- Client Components are isolated to controls requiring browser state or APIs.
- Use CSS Grid for page structure and Flexbox for one-dimensional alignment.
- Use `min-height: 100dvh`, never `100vh`, for full-height mobile shells.
- Account for `env(safe-area-inset-bottom)` in sticky mobile actions and
  navigation.
- Use Tailwind CSS v4 tokens backed by the CSS custom properties in this file.
- Do not introduce a component library without adapting it to these tokens.
- Do not add an animation library for basic interface transitions.

## 16. Forbidden patterns

- Pure black, cool corporate gray as the dominant canvas, or bright neon color.
- Pink/purple beauty-template gradients.
- Glassmorphism, outer glows, grain overlays, or ornamental blur blobs.
- Oversized centered hero text.
- Excessive pill shapes and excessive rounded cards.
- Desktop tables squeezed into mobile viewports.
- Tiny text or touch targets.
- Hidden labels, low-contrast placeholders, or color-only status.
- Fake analytics, decorative charts, or metrics without operational value.
- Client-side fetching when a Server Component or Server Action is sufficient.
- Generic copy, generic stock portraits, and emoji icons.

## 17. UI review checklist

Before accepting a page:

- Does the page have one obvious primary task?
- Does it work from 320px through desktop without horizontal overflow?
- Are loading, empty, error, success, and conflict states designed?
- Are all targets at least 44px and all text readable?
- Is Inter Tight applied consistently with the defined type scale?
- Are brand and semantic colors used according to meaning?
- Are card containers necessary, or would spacing and dividers be clearer?
- Is private information appropriate for the current role?
- Does the page remain useful without animation?
- Is server rendering preserved and client JavaScript minimized?

