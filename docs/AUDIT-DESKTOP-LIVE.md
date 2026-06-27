# Desktop Audit — Live Site (1440px viewport)

Walked the public site in a real Chrome desktop window at 1440×900 viewport (Chrome reported 1568×777 inner). Captured screenshots of each page, observed render order, scroll behavior, and image-load timing. Findings ranked by severity.

Pages visited: `index.html`, `comprar.html`, `catalogo.html`, `carrito.html`.

---

## Blockers (broken or near-broken)

### B1 — `comprar.html` only shows one of three format cards
At 1440px, only the **Decant** card renders. The 30 ml and 100 ml cards are absent from the interactive accessibility tree entirely (just one link present: "Ver catálogo de Decants · desde ₡5.000"). Decant is alone in the grid, taking the full width with an oversized image. The user lands here, sees one product, and assumes that's the whole catalog.
- **Where to look:** `src/pages/comprar.html` (markup for 30ml + 100ml cards) and `src/styles/comprar.css` (grid-template-areas in the desktop ≥700px breakpoint).
- **Likely cause:** the recent unrelated commits swept in changes to `comprar.html` that removed the two cards, OR the asymmetric grid added in the design pass left orphan grid areas with no matching elements.

### B2 — Hero image missing on initial paint
`/index.html` first paint: headline "Historias olfativas. Hechas a mano." occupies the whole left column; the right column is **completely blank** where the bottle image should sit. The image is marked `loading="eager"` + `fetchpriority="high"` so it should appear immediately. It eventually loads later in the session but not on first frame.
- **Where to look:** `src/pages/index.html` line ~52 (`<img class="hero__image">`) and `src/styles/styles.css` `.hero__media` rules.
- **Likely cause:** missing `width`/`height` on the visible viewport or a parent with `min-height: 0` that swallows the image until loaded.

### B3 — "Sesiones" right column is empty
The Sesiones section ("Una hora con Anthonny.") shows the text block on the left and **a totally blank space on the right** where the image / illustration should be. There's no media element rendering at all.
- **Where to look:** `src/pages/index.html` the `<section class="sessions">` block, and `src/styles/styles.css` `.sessions__inner` grid.

---

## Friction (visible bugs that don't break the flow)

### F1 — `CARRITO 0` shows in nav with an empty badge
On every page, the nav shows "CARRITO" with an ochre "0" pill badge — even though the cart is empty. The earlier behavior (and what `nav.js` was supposed to do per the prior fix) was to hide the link entirely when count = 0. Now the link is always present, and the badge reads `0`.
- **Where to look:** `src/scripts/nav.js` (the cart-link injection + `refreshCart()` poll) and any new `cart-drawer.js` that may now own that DOM.

### F2 — Vency originals desktop layout — images missing
On `catalogo.html` ≥900px, the Vency originals rows ("Citrus Enigma", "Vency Rouge", "Obsesión Carmesí", "Absolu Authority") show only the **text column** — name, notes, HISTORIA + VER button. The image column (which was supposed to be `flex: 0 0 42%`) is empty whitespace.
- **Where to look:** `src/styles/catalog.css` `.catalog-entry--vency` rules; `src/scripts/catalogo.js` `buildVencyOriginals` HTML output. The CSS expects `.catalog-entry__image` but the JS may render `.cat-entry__image` (class-name mismatch) or omit the image element entirely.

### F3 — Visible lazy-load flash on every section image
Scrolling through the index, every section image (perfumista, process step 01, process step 02, etc.) shows a **grey placeholder for ~1–2 seconds** before the real image swaps in. On a slow connection this would be much longer. The placeholder area is not styled to match the surrounding palette (gives a "loading" feel that breaks the slow-perfumery tone).
- **Fix:** add a low-quality blurred placeholder (BlurHash or just an `aspect-ratio` + `background-color: var(--atelier-stone)`), and consider switching the first 2–3 below-the-fold images to `loading="eager"` so they're decoded before the user scrolls.

### F4 — `comprar.html` Decant hero image is AI-generated gibberish
The image filling the Decant card has visible nonsense text on the bottle's label ("Atene a la Creaccion Inscoussel") and "VC" branding that doesn't match Vency's wordmark. It reads as a placeholder generated from a prompt, not a real product photo.
- **Where to look:** `src/assets/images/formats/decant-vial.jpg` — replace with a real photo of a Vency decant, even a phone shot on a neutral surface would land better than the current image.

### F5 — Page froze multiple times during scroll
On both `index.html` and `comprar.html`, the renderer became unresponsive for ~5s after a few scroll ticks (CDP screenshot calls timed out, then recovered). Likely the 1.5 MB hero PNG + large `.png` section images decoding on the main thread.
- **Fix:** ship `build-images.js` output (the WebP variants are already wired in the script; just need `npm i sharp && node build-images.js` then update HTML `src` paths). Independent finding already in the engineering audit.

---

## Polish (small, but the user will notice)

### P1 — Carrito empty-state alignment
`/carrito.html` empty state:
- "← Seguir comprando" and "TU PEDIDO · VENCY ATELIER" label **render on the same line**, overlapping. They should stack.
- "Carrito." h1 sits in the left third of the page, but the empty message ("Tu carrito está vacío") is centered on the full viewport — **inconsistent alignment** within the same page.
- **~250 px of empty space** between the h1 and the empty-state message. Could be tightened.
- **Where to look:** `src/styles/carrito.css` `.carrito-header` (back link + label flex), `.carrito-empty` (margin-top), and `main` max-width.

### P2 — `catalogo.html` page header label barely visible
The "CATÁLOGO · VENCY ATELIER" label and "Todo el catálogo." h1 render with very low opacity on first paint. Looks like the entrance-animation pre-state is stuck (opacity 0 → 1 transition delayed or not firing). After a few seconds they appear at full opacity.
- **Where to look:** `.animate-in` initial-state CSS in `src/styles/catalogo.css` and the `.is-in` toggle in `catalogo.js`.

### P3 — Quiz overlay always present in the DOM on `comprar.html`
The interactive accessibility tree on `/comprar.html` includes a personality quiz: radios for "atrevido / elegante / casual / poderoso / natural" and "Atrás" / "Siguiente" buttons. Visually it's hidden, but it's in the focus order — keyboard users hit it after the nav before reaching the format cards.
- **Where to look:** `src/scripts/quiz.js` (one of the recently-added files) + whatever HTML it injects. Should be set `aria-hidden="true"` and `inert` when not shown.

---

## What's working (verify and keep)

- **Asymmetric "Las Colecciones" grid** on `index.html`: Original Blend dominant left, Icon Series + Hybrid stacked right. Reads exactly as the impeccable design audit intended.
- **Catalog rows on desktop** (text + Ver button): clean typography hierarchy. The Vency Atelier header band looks strong.
- **Detail panel and tray flow** (not re-tested live, but DOM scaffolding present).
- **Cart empty state copy** is clear and ends with a primary CTA back to the catalog.
- **Decant explainer** on `comprar.html` ("Probá antes de comprar… Un decant es un atomizador de 10 ml con el perfume original") is rendering — UX fix #1 shipped successfully.

---

## Recommended fix order

| # | Item | Severity | Effort |
|---|---|---|---|
| 1 | Restore 30 ml + 100 ml cards on `comprar.html` (B1) | 🔴 blocker | XS — bug, probably 1 file |
| 2 | Hero image first-paint (B2) | 🔴 blocker | S |
| 3 | Sesiones right-column image (B3) | 🔴 blocker | XS |
| 4 | Hide `CARRITO 0` nav link when empty (F1) | 🟡 friction | XS |
| 5 | Vency-originals desktop images (F2) | 🟡 friction | S |
| 6 | Run `build-images.js` + wire WebP `<picture>` (F3, F5) | 🟡 friction | M |
| 7 | Replace AI-gibberish Decant photo (F4) | 🟡 friction | XS (just an asset swap) |
| 8 | Carrito empty-state alignment (P1) | 🟢 polish | XS |
| 9 | Catalog header animate-in stuck (P2) | 🟢 polish | XS |
| 10 | Quiz overlay `aria-hidden` / `inert` (P3) | 🟢 polish | XS |

The three blockers (B1, B2, B3) all surfaced because of unrelated changes that got swept into recent commits (the same batch that added `quiz.js`, `cart-drawer.js`, `search.js`, `AGENTS.md`, `install.ps1`). Worth a focused diff review of those commits — likely a single file change in each one to restore working state.
