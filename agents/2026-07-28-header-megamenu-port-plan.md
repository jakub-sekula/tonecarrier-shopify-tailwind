# Header megamenu — theme port plan

Date: 2026-07-28
Design reference: `mockups/tone-header-megamenu-mockup.html` (approved styling — sharp corners,
shared-shell panel with horizontal pane slide, draggable screenshot slider, grouped hardware cards,
BETA/New badges, Kickstarter logo).

## Goal

Port the approved mockup into the Dawn-based theme as a **block-configurable header component**:
every top-level item and every piece of panel content (labels, copy, images, links, badges) editable
in the theme editor, and every item/panel hideable without code changes.

## Architecture

### Block model (order-based ownership)

Shopify blocks are flat, so nesting is expressed by order: a *panel* block starts a top-level nav
item; the child blocks that follow it belong to that panel until the next panel/link block.
This is the same convention Dawn uses for mega menu levels, and gives add/remove/reorder/hide
for free in the theme editor.

| Block type | Starts item? | Settings |
|---|---|---|
| `menu_link` | yes (plain link) | label, link, badge text |
| `panel_cards` | yes (card grid) | label, badge, lead text, lead sub-text |
| `card` | child of panel_cards | image, alt, title, caption, link, badge text, badge style (accent/muted/digital), optional "starts group" heading, "featured on mobile" (full-width w/ caption in drawer), extra logo image (e.g. Kickstarter wordmark) |
| `panel_feature` | yes (feature panel) | label, nav badge ("New"), title ("toneScan Studio"), title badge ("Beta"), description, bullet 1–5, CTA label, CTA link, CTA colour (brand blue), glow colour |
| `slide` | child of panel_feature | image, alt, caption |
| `panel_links` | yes (link list) | label |
| `link_item` | child of panel_links | icon (select: book/play/camera/tools/none), title, caption, link |

Current IA prefilled in `sections/header-group.json`:
- Hardware (panel_cards): group "Film transport systems" → Scan 35 mm / Scan 120 / Scan 110;
  group "Lighting" → toneLight (Coming soon badge, KS logo, → KS pre-launch page)
- Software (panel_feature, "New" badge): toneScan Studio + Beta badge, 4 bullets, blue Learn more,
  5 slides w/ captions
- 3D print files (panel_cards): DIY lead + sub-line; Print 35 mm / Print 120 (Digital badge) /
  Print 110 (Coming soon, disabled) / Assembly hardware kits
- Guides (panel_links): What is camera scanning / Get started / Gear recommendations / Build guides
- Examples, Reviews (menu_link) — **added hidden** until their pages exist

Hiding a panel block hides the whole item; children of a hidden panel must be hidden too
(orphaned children would otherwise attach to the previous panel — documented editor caveat).

Nav structure lives entirely in these blocks (theme editor = single source of truth); the admin
Navigation menu is no longer used by the header. Block count ≈ 18 of the 50-per-section limit.

### Files

- `sections/header.liquid` — schema gains the 7 block types; renders the new snippets; falls back
  to the existing Dawn menu when no blocks are configured (safety for unconfigured themes).
- `snippets/tc-mega-menu.liquid` — desktop shell + panes (one pass over section.blocks builds the
  item list; panes rendered inside the single `.mega-shell`).
- `snippets/tc-mega-drawer.liquid` — mobile drawer from the same blocks ("featured on mobile"
  cards render full-width with caption; feature panel renders screenshot-above-title).
- `assets/component-tc-mega-menu.css` — styles lifted from the mockup (zero radii, shell slide,
  badges, group heads, slider), tokens aligned with theme settings where sensible.
- `assets/tc-mega-menu.js` — two custom elements, Dawn-style, no dependencies:
  - `<tc-mega-menu>` — shared shell open/close, pane slide direction, height animation,
    hover-intent + click, outside-click/Esc, focus handling.
  - `<tc-slider>` — track slider: drag 1:1, snap ≥15% width, wrap, arrows, dots, caption
    swap, autoplay 4 s (paused on hover/focus/hidden pane, disabled for reduced motion).
- Theme editor: re-init both elements on `shopify:section:load` / `shopify:block:select`
  (select should open the owning pane so editors see what they're editing).

### Images

All mockup images already live in Shopify Files (`cdn/shop/files/…`), so `header-group.json`
defaults can use `shopify://shop_images/...` paths. Exception: `tonescan-hero.png` is a theme
asset → upload to Files (or keep asset fallback for the default). Render via `image_url` with
`srcset` widths (400/600/900), `loading="lazy"`, per-block alt text.

## Accessibility (explicit requirement)

Pattern: **APG "disclosure navigation menu"** (recommended for site nav; simpler and more robust
than a full menubar).

- Semantics: `<nav aria-label="Main">` → `<ul>/<li>`; panel triggers are real `<button>`s with
  `aria-expanded` + `aria-controls="<pane id>"`; plain items are real `<a>`s. Card/feature titles
  demoted from `h3/h4` to styled `span`/`p` (no heading-outline noise inside nav).
- Panes: `role="region"` + `aria-label`; **inactive panes get `hidden`/`inert`** (not just
  opacity 0) so they're skipped by tab order and screen readers; the active pane's links are
  reachable by Tab.
- Keyboard: Enter/Space toggles; **Esc closes and returns focus to the trigger**; closing on
  focus-out (focus leaves both trigger and shell); hover-open never traps focus.
- Slider: container `role="region"` + `aria-roledescription="carousel"` + label; arrows/dots have
  aria-labels ("Next screenshot", "Slide 2 of 5", `aria-current` on active dot); off-screen slides
  `aria-hidden` + focus-disabled; caption is `aria-live="polite"`; autoplay off under
  `prefers-reduced-motion`, paused while focus is inside.
- Motion: pane slide/height animations collapse to instant under `prefers-reduced-motion`.
- Mobile drawer: `role="dialog"` + `aria-modal`, focus trapped while open, Esc closes, scrim click
  closes, focus returned to burger button.

## SEO

- Every destination is a crawlable `<a href>` inside the panes (triggers are buttons, but all
  targets — collections, pages — are plain links in the DOM on page load; no JS-injected links).
- No headings inside nav; no duplicate-content risk (drawer links mirror desktop, standard).
- Images lazy-loaded with proper `alt`; no CLS (shell is absolutely positioned; fixed slider
  aspect ratio).
- Nav labels/links come from section JSON → rendered server-side in Liquid (crawlable without JS).

## Steps

1. Branch `feature/header-megamenu` off `main` (main == live theme, verified byte-identical).
2. CSS/JS assets extracted from the mockup (mock-bar excluded).
3. `tc-mega-menu.liquid` + schema + `header.liquid` wiring (desktop), Dawn-fallback intact.
4. `tc-mega-drawer.liquid` (mobile).
5. Prefill `header-group.json` with the agreed content; upload `tonescan-hero.png` to Files.
6. A11y pass (keyboard walkthrough, VoiceOver smoke, axe/Lighthouse).
7. Preview on the dev theme (`shopify theme dev`), Jakub reviews against the mockup.
8. Iterate → merge to `dev` → push to the dev theme → publish decision alongside the rest of the
   header/nav rollout (Software item points at the toneScan page only once it's live).

## Open questions / decisions taken

- Breakpoint: use Dawn's 990 px (not the mockup's 920 px) for consistency with the rest of the theme.
- Announcement bar: unchanged for now; revisit once toneLight ships in the hardware panel.
- "3D print files" nav wrapping at narrow widths: tune spacing at the 990–1100 px range during port.
- Software destination page (`/pages/tonescan`) is still only on the `tonescan-landing` branch —
  the menu item can ship pointing there once that page is published; until then keep the block
  hidden or point Learn more at the beta signup.
