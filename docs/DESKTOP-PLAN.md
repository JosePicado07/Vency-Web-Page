# Desktop ≠ Mobile — Two Experiences, One Codebase

## The diagnosis

Every issue Jose flagged is a symptom of the same root cause: **the site has one design (mobile) being stretched to fit desktop viewports**. There is no desktop *design*; there are mobile components inside `max-width: 1100px` containers floating on a 1920 px canvas.

The fix is not more breakpoints. The fix is to **author two compositions** — share the components, but lay them out, scale them, and pace them differently above/below ~1024 px.

| User's complaint | Underlying cause |
|---|---|
| "No image still on the session" | `.sessions__inner` is `max-width: 600px` (mobile column). The dark band beside it is intentional on mobile but reads as void on desktop — no commitment to either an image, a quote, or a wordmark to fill it. |
| "Comprar looks off on desktop" | `.comprar-formats` is `max-width: 1100px`. On a 1920 viewport that's ~50% of the canvas, with the 30 ml + 100 ml cards rendered at mobile-card proportions. Also: both bottle photos are literally the same AI-generated image. |
| "Catalog top is very crowded" | The catalog header packs label, h1, count, legend, helper strip, filter row, two disclosures, and the Vency intro block in tight vertical stack. On mobile that's fine (vertical scroll). On desktop the horizontal space is wasted while the vertical is over-loaded. |
| "Carrito looks so mobile-first / way off proportionate on desktop" | The cart drawer is a fixed-narrow sheet that overlays a tiny strip in the center. On desktop the slide-in pattern should be a right-side panel ~480 px, OR the cart icon should just go to `/carrito.html` (the full page) on desktop. |
| "Both arrows look left" | Actual code bug in the `completa-con` carousel — both buttons render the same chevron SVG. |

---

## The approach: register two compositions

Add a single global breakpoint — **`--bp-desktop: 1024px`** — and treat everything above it as a different page. Not "responsive variations of the same layout" but **two layouts that share data, type, and color**.

Rules of thumb:

1. **Mobile** is the storefront in your hand. One thing per screen. Stack everything. Generous touch targets. Tray + drawer for the cart. Sheet modals.
2. **Desktop** is a magazine spread. Pair things side-by-side. Use the horizontal canvas. Sidebar nav patterns. Right-side cart panel. Editorial typography proportions (larger but proportional). No `max-width: 1100px` sitting in a 1920 viewport with grey on both sides — either commit to a wider canvas (1440–1600) **or** intentionally art-direct the negative space with editorial mark / wordmark / large quote.
3. **Components are shared**, **layouts diverge**. A fragrance card stays a fragrance card; how three of them sit on the page is the layout decision.

This is what Le Labo, SSENSE, Bottega Veneta, and Aimé Leon Dore all do — same product cards, completely different home + PLP composition on mobile vs desktop.

---

## Page-by-page desktop plan

### 1. Hero (`index.html`)
- **Mobile**: keep current — h1 stacked over bottle image, full-screen.
- **Desktop**: keep the 56/44 split but **fix the 1.2 MB PNG paint**. The grey aspect-ratio block is right; the source is too heavy. Action: run `build-images.js`, swap `<img src>` to the 1200 w WebP variant (~150 KB), drop the breathing animation if it's adding decode cost.

### 2. "Las Colecciones" grid
- **Mobile**: single column.
- **Desktop**: keep the asymmetric Original Blend dominant + Icon / Hybrid stacked right. **Already shipped, no change.**

### 3. El Perfumista
- **Mobile**: text-first, image below.
- **Desktop**: two-column already. **No change.**

### 4. Sesiones (the image you flagged)
- **Mobile**: single dark column, current. Fine.
- **Desktop**: the empty right side is the problem. Three options ranked by ROI:
  - **(A) Commit to negative space** — drop a huge ambient `VC` mark or full-bleed botanical illustration on the right. Brand register has permission for this; it would feel intentional.
  - **(B) Add an image** — a photo of the atelier, Anthonny working, or session materials.
  - **(C) Make it a single-column dark band** that runs full-width with the copy centered, no two-column attempt. This is the cheapest fix.
  - Recommend **(C) for now**, **(A) when an asset exists**.

### 5. Process strip (01/02/03 numbered steps)
- **Mobile**: stack.
- **Desktop**: three side-by-side cards work today. **No change.**

### 6. Comprar.html (format hub)
- **Mobile**: Decant card top, 30 ml + 100 ml stacked below. Current works.
- **Desktop**: today it's a mobile layout in a `max-width: 1100px` cage. Move to **full-bleed editorial**:
  - Decant card spans the wider canvas (1440 px) as a horizontal hero — big image left (≥600 px wide), copy + CTA right.
  - 30 ml + 100 ml become **vertical posters** below, each filling half the width with portrait-oriented imagery. Not the current squat thumbnails.
  - **CRITICAL content fix**: 30 ml and 100 ml currently use the **same image** as decant. Tony needs to provide three distinct format photos. Until then, programmatically tint / crop the same source differently so they at least don't read as duplicate.

### 7. Catalog top header (the crowded one)
- **Mobile**: current stack fine.
- **Desktop**: redistribute horizontally. Proposed:
  - **Left column (~40%)**: title block "Todo el catálogo." + ochre label.
  - **Right column (~60%)**: count + legend + helper strip + filter row, vertically aligned to bottom of title.
  - The "Nuestras Colecciones" disclosure + "Vency Atelier · Probá antes de comprar" block sit below as an editorial intro band — not crammed into the header zone.
- Effect: title gets to breathe; ancillary info doesn't compete; filter is reachable in one glance.

### 8. Carrito (cart)
- **Mobile**: full-page `/carrito.html` (current) when going to checkout. Drawer is fine as a peek.
- **Desktop**: two distinct UI elements, two distinct triggers.
  - **Nav cart icon** → opens a **right-side slide-in panel** (~440 px) overlay with cart line items + total + "Ver carrito" button. Quick peek.
  - "Ver carrito" inside the panel → navigates to `/carrito.html` (full page) for editing qty / delivery / WhatsApp confirm.
  - On desktop, the cart drawer should never be a centered narrow sheet — that's a mobile sheet pattern misapplied.

### 9. Completa con (the broken-arrows carousel)
- **Quick bug fix**: right-arrow SVG was copy-pasted from left. Independent of any layout plan; can ship in 2 minutes.
- **Desktop**: show more cards per row (5–6 visible vs current 4 truncated). Native scroll, no arrows needed if the rail fits.

### 10. Detail panel ("Ver →")
- **Mobile**: full-height bottom sheet (current). Fine.
- **Desktop**: should be a **centered modal** (~720 px wide, 80 vh tall) with image left, copy + add-to-cart right. The mobile bottom-sheet pattern doesn't translate.

### 11. Nav
- **Mobile**: hamburger + slide-down panel (current). Fine.
- **Desktop**: inline link bar (current). Add visual rhythm: ochre underline on hover, slightly more letter-spacing. Search + cart icons stay on the right.

---

## Implementation phases

### Phase 1 — Cheap wins (1 session, no design decisions)
1. **Arrows bug** in `completa-con` carousel — swap one SVG.
2. **Hero image perf** — run `build-images.js`, swap to WebP.
3. **Sesiones desktop** — option (C): make it a single-column centered dark band so the empty right stops reading as a bug.
4. **Comprar desktop** — kill the `max-width: 1100px` cap on desktop, let cards span more.

### Phase 2 — Desktop layout redesign (one focused session per page)
1. **Catalog top header** rework — title left, meta + filter right, intro band below.
2. **Comprar full-bleed editorial** — Decant hero horizontal, 30 ml + 100 ml as half-width portrait posters.
3. **Cart slide-in panel on desktop** — replace the centered narrow sheet with a 440 px right-side panel; navigate to `/carrito.html` for editing.
4. **Detail panel desktop modal** — center, 720 × 80vh, image-left layout.

### Phase 3 — Content (blocked on Tony)
1. **Real format photos** — three distinct images for Decant / 30 ml / 100 ml. The AI-generated VC-bottle placeholder is reading as fake.
2. **Sesiones desktop image** — atelier shot or ambient illustration for the right column.
3. **Fragrance bottle photos** — replace `default-bottle.jpg` placeholders one by one.

### Phase 4 — Polish
1. Editorial pacing on desktop — rhythm of section spacing, big quotes, ambient marks.
2. `aria-hidden` + `inert` on the quiz overlay when closed.
3. Lazy-load placeholder colors per section (botanical-stone, volcanic-ink, etc.) so the flash matches the section ground.

---

## What this is NOT

- It's not "make the mobile look bigger on desktop." That's what we have today.
- It's not "use a CSS framework / move to Bootstrap." The hand-built CSS is fine; it just needs desktop compositions.
- It's not "rebuild from scratch." The components, color system, typography, and PRODUCT.md are good. Only the **layout above 1024 px** is the gap.
- It's not "make every page look like Le Labo." Borrow the *patterns* (editorial pacing, slide-in cart, centered detail modal) but the brand voice stays Vency.

---

## Decision checkpoint

Before I touch any layout code, I'd like Jose's call on three things:

1. **Sesiones desktop**: option (A) ambient mark, (B) photo, or (C) single-column centered band?
2. **Cart on desktop**: slide-in right panel (440 px) OR just bypass the drawer and always go straight to `/carrito.html` on desktop?
3. **Comprar desktop hero proportions**: should Decant span ≥1200 px (close to full canvas) or stay around 1100 px and let the layout breathe with margins?

Phase 1 cheap wins can ship before those decisions are made.
