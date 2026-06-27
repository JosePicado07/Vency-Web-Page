# Vency Web Page — Audit

## Engineering (ponytail)

Ranked by impact: how much code/risk a single deletion or simplification removes. Source-of-truth confusion ranks above isolated dead code; correctness bugs flagged **BUG**.

### Tier 1 — high-impact / source-of-truth confusion

1. **`src/scripts/admin.min.js` (1363 lines) vs `src/scripts/admin.js` (1399 lines).** `admin.html` line 227 loads `admin.min.js`; we keep editing `admin.js`. `admin.min.js` is **not minified** — same line breaks, just comments stripped, and has drifted (different code around lines 1268, 1289+). The file you don't read is the one shipping. Pick one: delete `admin.min.js` and load `admin.js`, or make `admin.js` source and run a real minifier in a build step. Same shape for the CSS pair — `admin.min.css` *is* genuinely minified (299 vs 1703 lines), keep it; the JS pair is the broken half.

2. **Dead `cat-sentinel` infrastructure** (`catalogo.js:9,283`, `catalogo.html:209`, `catalog.css:196`). Lazy-reveal was removed in commit `242e87b`; the sentinel `<div>`, the `var sentinel` lookup, the `sentinel.hidden = true` line in `render()`, and the `.cat-sentinel` CSS rule are leftover. Delete all four.

3. **`window._catScrollLock`** (`decants.js:410,413,420`). Only reader was the now-deleted sentinel observer in `catalogo.js`. Setter still fires in `openPanel/closePanel`. Delete the three assignments; the global does nothing.

4. **BUG · `admin.js:1385` references undefined `searchEl`.** The "/" keyboard shortcut handler uses `searchEl`; the actual variable is `searchInput` (declared line 86). The shortcut throws `ReferenceError` and never works. Fix to `searchInput` or delete the handler.

5. **BUG · `admin.js:560` references out-of-scope `refreshBtn`.** `refreshBtn` is declared inside `setupPeriodTabs` (line 495). When `loadMetrics` fails, the catch hits a ReferenceError and swallows the real network error. Hoist `refreshBtn` to module scope or remove the line.

6. **Dead `inventory._byKeyword` fallback** (`admin.js:1289-1297`). Server never populates `_byKeyword`. Delete the branch; rely on `inventory[searchName] || inventory[id]`.

### Tier 2 — duplicated helpers

7. **Three different HTML-escape helpers across files:**
   - `fragrance-data.js:851` — `root.escHtml` (regex, escapes `&<>"`)
   - `admin.js:316` — `escapeHtml_` (uses `div.textContent`; escapes `&<>` but **not `"`**)
   - `decants.js:36` — `esc` (regex, escapes only `&<>`)

   The admin variant not escaping quotes matters: admin builds `aria-label="..."` and `data-*="..."` from raw fragrance names. Latent XSS surface. Collapse to the `window.escHtml` regex version; delete the other two.

8. **`generateRef()` duplicated** in `admin.js:110` and `decants.js:28` (identical one-liner). Move to `root.vencyRef` in `fragrance-data.js`.

9. **`colones()` duplicated** in `admin.js:109` (`toLocaleString('es-CR')`) and `decants.js:32` (hand-rolled regex). Same output. Keep `toLocaleString`, delete the regex.

### Tier 3 — premature abstractions / dead config

10. **`fragrance-data.js` — dead `formats`, `categoryLabel`, `value/label/price` fields on every Vency entry.** Zero readers outside the data file itself. ~42 entries × 5 dead keys. Prices live in `decants.js` (`BOTTLE_PRICE`, `SET_PRICE`, `DECANT_PRICE`) and `admin.js` (`B30_PRICE`, `B100_PRICE`); the data file's `price` numbers can't influence anything. Strip `formats` + `categoryLabel`.

11. **Admin pagination** (`admin.js:14` `PAGE_SIZE = 12`, plus `fragPage`, `invPage`, `fragObserver`, `invObserver`, `appendFragPage`, `appendInvPage`, both sentinels). Same lazy-reveal anti-pattern the public catalog just removed: ~280 fragrances paginated via IntersectionObserver for **one user on his phone**. Render the full list once; delete ~80 lines.

12. **`decants.js:21,494-536` — `cachedStock` + `refreshStock()` polling every 2 minutes.** Public stock is *already* synced via `localStorage['vency_inventory']` (catalogo.js:75). Two parallel stock-truth systems. Pick one. If localStorage stays, delete the polling loop (40+ lines + recurring fetch traffic).

13. **`catalog.css` (921 lines) — top ~190 lines are dead.** `.catalog-filters`, `.filter-row`, `.filter-row__header` — zero matches in any HTML/JS. The file header comment says "used by coleccion.html and (filter bar) decants.html" but decants.html is now a 12-line redirect stub. Delete the dead block.

### Tier 4 — small wins

14. **`decants.html` (12 lines) is a meta-refresh + JS redirect to `catalogo.html`.** Server-side redirect (`.htaccess`, `_redirects`, Cloudflare rule) replaces it without an HTML round-trip + script execution.

15. **`?v=` cache-busting drift across pages.** `fragrance-data.js?v=20` (catalogo, admin, coleccion), `nav.js?v=19` everywhere except `index.html`/`legal.html` (unversioned) and `comprar.html` (with `defer`). Pick one: bump all together via a build script, or drop versions and let the service worker handle freshness. Today stale browsers see inconsistent JS combos.

16. **Repo-root clutter** showing in `git status`: `"C:UsersJoseAppDataLocalTempngrok-vency.log"`, `"C:UsersJoseAppDataLocalTempvency-server.log"` (malformed Windows-redirect filenames), `generate-icons.js`, `verify-admin.js`, two large PDFs, `Logo Hibridos Vency Atelier.png`. Add to `.gitignore` and delete from tree.

17. **`localStorage['vency_inventory']` "sync" comment oversells what it does** (admin.js:1379 writes, catalogo.js:75 reads). It's same-browser-profile only. Public visitors on other devices see no AGOTADO state regardless of real inventory. Not a delete — just note that "synced by admin" should read "synced *to this browser* by admin"; a cross-device fix would need a published JSON or endpoint.

### Skipped (out of scope but spotted)

- Three different `/exec` POST callers (`loadMetrics`, `refreshStock`, `logOrder`, `confirmSale`, `cancelOrder`, `batchUpdateStock`, `validateToken`) would all benefit from a shared `post(action, body)` wrapper. Defer; not blocking.
- Vendor prefixes (`-webkit-`, `-moz-`) in `admin.css`, `decants.css`, `catalogo.css` — most still help Safari/iOS. Don't strip blindly.

---

## Design (impeccable)

Brand register. PRODUCT.md present, DESIGN.md present, both committed. Audit performed against the system the project authored for itself, not against generic taste — a finding is a finding because the project's own DESIGN.md or PRODUCT.md says so, or because it triggers an impeccable absolute ban.

The honest summary: this project knows what it wants to be (Volcanic Garden, slow perfumery, anti-department-store, anti-SaaS, one proclamation per section, Sage scarcity, no shadows, no white). The DESIGN.md is unusually opinionated and good. The implementation is **partially aligned**. The fragrance pages (detail panel, hero, perfumista, process) execute the system well. The **two highest-traffic top-of-funnel pages — `index.html` "Las Colecciones" and `comprar.html` — both ship the exact pattern DESIGN.md explicitly bans**: three identical card columns with tag-title-desc-CTA. They are the first thing a visitor sees and the place the brand most needs to commit. They currently read as SaaS-template wearing a Bitter typeface.

Ranked by impact: highest blast radius first.

---

### `comprar.html` — Format hub  · **slop** (highest impact)

The page is a 3-up grid of three structurally identical `.fmt-card` blocks (image / price label / title / desc / CTA). This is the textbook "identical card grid" pattern listed in impeccable's shared absolute bans AND in this project's own DESIGN.md Don't list: *"Don't repeat identical card proportions in a grid. Each fragrance presentation must differ in layout proportion or compositional arrangement from its neighbors."* The format hub is the worst place this could happen — it is the visitor's first commercial decision, and it is rendered as a Shopify-shaped funnel.

- **Three identical card columns** (slop). Fix: break the grid intentionally. The three formats are not peer SKUs, they are a *progression of commitment* (sample → middle → full). Express that progression spatially: one tall hero format (Decant, the entry point), two flanking smaller formats, or a vertical scroll-narrative that introduces each at a different scale. Reject the `repeat(3, 1fr)`.
- **`fmt-card__title` copy: "¿Sin idea de qué elegir?"** (weak). Conversion-funnel voice, opposite of PRODUCT.md *"slow is a stance, no urgency, no countdown timers, no conversion pressure."* Rewrite as material-first: *"Diez mililitros. Tres pruebas."* Lead with the object.
- **Subheader: "El mismo catálogo, la misma calidad."** (slop). Restates the obvious — pure filler. Cut.
- **CTA `Ver decants →` repeated three times** (weak). Three CTAs at the same visual weight on the same screen contradicts *"one strong thing per screen."* Vary the CTA copy and weight per format, or let the format card itself be the click target with no labeled CTA at all.
- **Severity: highest impact.** This is the first commercial page; the AI-slop test ("would a visitor say AI made this?") currently fails here.

---

### `index.html` — "Las Colecciones" grid · **slop**

Three identical `.coll-block` columns: Original Blend / Icon Series / Hybrid, each with tag-title-desc-price-CTA. Same indictment as `comprar.html`. The Hybrid block tries to differentiate itself with an opacity-0.06 `∞` background flourish and a dark inverse treatment — that *attempt* is the right instinct, but it doesn't go far enough: the underlying grid is still three columns of the same shape.

- **Three-card grid** (slop). Fix: keep the asymmetry the Hybrid block hinted at, push it further. Make Original Blend the dominant block (Display-scale Bitter proclamation, generous image, full-bleed), Icon Series a contrasting second beat (smaller, more typographic, less imagery), Hybrid the closing dark moment. Three different visual worlds in three different proportions — exactly what DESIGN.md asks for in *"Vary the proportions and arrangement of each fragrance presentation unit."*
- **`.coll-block__name: "Composiciones<br>originales."`** — competing Display proclamations (fine). Three Bitter h3s at `clamp(1.35rem, 2vw, 1.85rem)` all at similar weight in the same band. DESIGN.md's One Proclamation Rule says exactly one Display per section. Demote two of the three.
- **"LAS COLECCIONES · VENCY ATELIER" → "La colección."** (weak). The h2 *literally restates the label above it* — the same kind of restated-heading slop the impeccable copy rules call out. Either drop the label, or rewrite the h2 to say something the label doesn't already say.

---

### Hero (`index.html`) · **fine**, drifting toward weak

The masked-reveal headline ("Historias / olfativas. / Hechas a mano.") plus breathing bottle image is the best moment on the site. It earns its place. Two issues drag it back from strong:

- **Five stacked text elements** (weak): headline + body + primary CTA + sessions secondary link + provenance label. DESIGN.md says *"one strong thing per screen is more powerful than five polished things."* The hero is currently a list. Distill: keep the headline, the bottle image, and ONE supporting line. Move "Sesiones de Atelier · Heredia →" and the provenance ALL CAPS line to their own sections downstream.
- **`hero__provenance` ALL CAPS body line** (fine). Within Label-voice rules; just borderline long. Tracking 0.13em + this length scans as banner-text.

---

### `catalogo.html` — Filter system + entry rows · **fine** to **strong**

The catalog itself is the strongest execution of the system. Vency entries with image, narrative, format rail, and inspiration line earn their space; the typography hierarchy (Bitter Display name → tracked ALL-CAPS notes ledger → italic inspiration → ochre historia link) lands the *"ingredient label rule"* DESIGN.md describes. Filter pills and search row are restrained-in-the-right-way. Three concrete issues:

- **`AGOTADO` double-render** (slop, **highest visual priority on this page**). The mobile screenshots show TWO AGOTADO badges on the same row: an inline `.cat-badge--sold-out` next to the fragrance name AND a separate `.fmt-rail--sold-out` button replacing the buy rail. Both fire at the same time (catalogo.js:103 and catalogo.js:119). Pick one. Recommendation: keep the rail-replacement (right side, where the action would be) and drop the inline name-adjacent chip. The double-tag reads as a bug.
- **`scroll-top` FAB** (weak). Generic floating circle, standard SaaS pattern, present across pages. PRODUCT.md anti-references explicitly call out *"startup / SaaS aesthetic"*. A scroll-to-top is fine — but the current circular ochre-outlined button is the off-the-shelf shape. Either tie it visually to the system (a Label-style tiny "VOLVER ARRIBA" tracked in Manrope) or remove it; the page isn't that long on desktop.
- **Em dashes in headings/meta** (slop, low priority). `<title>` reads "Catálogo — Vency Atelier · Heredia, Costa Rica" — 14 em-dash occurrences in this page alone. impeccable shared rule: *"No em dashes."* Search-replace to `·` (already used elsewhere in the same titles) or `,`.

---

### `coleccion.html` · **weak**

Functionally a second catalog. PRODUCT.md and IA do not justify having both `coleccion.html` and `catalogo.html` — they overlap in purpose. Out-of-audit-scope to redesign, but flag: the IA itself is slop-adjacent (e-commerce orthodoxy ships a "shop" page and a "collection" page because the template did, not because the user needs both). Per PRODUCT.md: *"The experience should feel like visiting a studio, not a storefront."* Two pages doing the same job is the storefront pattern. Consider collapsing.

- **Header copy: "Veinte composiciones. Tres formatos."** (strong). Tight, material, restraint-with-confidence. Keep.
- **Cat grid: `1fr 1fr` at ≥680px with `:nth-child(even) border-left`** (fine). The alternating border treatment is a subtle break from card-orthodoxy. Acceptable.

---

### `faq.html` · **fine**

`<details>`/`<summary>` accordions, Bitter for the question, Manrope for the body, faint chevron. Native semantics, no JS. Nothing wrong. Nothing memorable either — a brand register has permission to be more designed here (a brief that says "slow is a stance" can afford to let questions and answers breathe in different visual worlds), but a functional FAQ does not actively hurt the brand.

- **No issues worth fixing alone.** Add to a polish pass if/when redoing typography globally.

---

### `legal.html` · **fine**

Has a horizontal jump-nav with `·` separators (good — consistent with the brand voice) and section blocks. Borderline-template but legal pages have low aesthetic stakes. Acceptable.

- **No fixes needed.** Within tolerance.

---

### Detail panel (built dynamically in `catalogo.js`) · **strong**

The sliding sheet with `border-radius: 16px 16px 0 0`, blur-backdrop, and translateY entrance is the most-considered interaction on the site. Motion uses cubic-bezier(0.16, 1, 0.3, 1) — the exact ease-out-expo DESIGN.md prescribes. The blur on `.fp__backdrop` is `blur(3px)` — purposeful, not glassmorphism wallpaper. Earns its place.

- **No fixes.** Best-in-class moment.

---

### Cross-cutting findings (apply across pages)

| # | Finding | Severity | Fix |
|---|---|---|---|
| C1 | **Sticky nav glassmorphism**: `.nav--scrolled` uses `backdrop-filter: blur(10px)` + translucent parchment. Per impeccable absolute bans: *"Glassmorphism as default."* The scrolled-nav blur is the SaaS-default reflex. The brand has its own ground color — commit to it. | slop | Drop the blur. Use solid `var(--botanical-parchment)` on `.nav--scrolled` with a 1px ochre or stone underline as the only state change. |
| C2 | **Volcanic Ink hue**: token is `oklch(18% 0.04 180)`. Hue 180 is cyan/teal. DESIGN.md describes it as carrying "a trace of the volcanic mineral world" — green-mineral. The current value is cooler than intended. | weak | Shift hue to ~145–160 (the same family as Sage Mineral) for the trace-green undertone the brief describes, or change the brief if cyan is intentional. |
| C3 | **Color strategy never commits**: DESIGN.md says Full Palette but execution reads as Restrained-with-ochre-accents. No section anywhere drenches in Volcanic Ink, Warm Ochre, or Sage Mineral. The brand register has permission for Committed/Drenched and the brief explicitly invites it. | weak | Pick ONE section per page to commit. Suggested candidates: the Hybrid block (already dark — push further), the Sesiones section (already dark — push further), one fragrance hero in the catalog (drench in its `--entry-accent`). |
| C4 | **Card overuse**: `.coll-block`, `.fmt-card`, `.cat-entry`, `.frag-nav` — cards-as-default. impeccable shared rule: *"Cards are the lazy answer."* Cards-everywhere is exactly the e-commerce-orthodoxy PRODUCT.md anti-references. | weak | Audit each: does this need a bordered/padded container, or can the content sit on the parchment ground separated by typography and rhythm alone? Most can lose the border. |
| C5 | **Em dashes in titles and meta** across all pages (33 total). impeccable shared copy rule: *"No em dashes."* | slop | Search-replace `—` → `·` in titles/meta (which already use `·` as the convention) and `,` in body prose. |
| C6 | **`hover: scale(1.03)` on images** (hero, fmt-card, coll-block). Polish-reflex hover that ships on every template. Not banned, but ubiquitous. | fine | Optional: replace with a color/filter shift (`filter: brightness(1.05)` or a slow tint), or remove on the brand-register surfaces that should feel like objects, not buttons. |
| C7 | **PRODUCT.md and DESIGN.md are excellent — implementation should reread them.** The DESIGN.md "Don'ts" list literally bans the identical card grid that `comprar.html` and the colls-intro grid ship. The team wrote the right rules and then didn't follow them. | n/a | Treat the Don'ts list as a checklist during the fix pass; the system is already authored. |

---

### Severity rollup

- **slop**: `comprar.html` 3-card grid · `index.html` colls-intro grid · catalogo AGOTADO double-render · nav glassmorphism · em-dashes
- **weak**: hero element-stacking · scroll-top FAB · restated headings · coleccion/catalogo IA overlap · color never commits · card overuse · Volcanic Ink hue
- **fine**: catalog system · filter UI · faq · legal · process section · perfumista
- **strong**: hero masked-reveal · Vency catalog entries · detail panel sheet · process numbered steps · the DESIGN.md itself

**One sentence:** fix `comprar.html`, fix the colls-intro grid, and kill the duplicate AGOTADO — those three changes alone move the site from "AI made this" to "made by someone who knows exactly what they're doing."

**Out of scope (called out, not fixed):** admin redesign, format-split deeper IA, image assets/photography, the coleccion-vs-catalogo IA overlap (separate strategic decision).

---

## Audit (impeccable · a11y / perf / responsive)

Technical complement to the engineering and design sections above. Scope: public pages only (`index`, `catalogo`, `comprar`, `coleccion`, `faq`, `legal`) and their JS/CSS. Admin out of scope unless a shared file matters.

### Health score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 2.5/4 | Detail-panel dialog has no focus trap and never restores focus to its trigger. Heading hierarchy on `index.html` jumps h1 → h3. Sub-44px touch targets in the detail panel and on `.cat-entry__see`. |
| 2 | Performance | 3/4 | Render-blocking Google Fonts and unscoped `nav.js`/`scroll.js` on index. No `srcset`/`sizes` on any responsive image. SW network-first writes every GET into cache (including third-party). |
| 3 | Responsive | 3/4 | Touch targets are the main gap. Asymmetric grids behave well at the documented breakpoint, but `100svh` minimums on hero/colls cause iOS Safari content-clipping at narrow viewports without fallback. |
| 4 | Theming | 3/4 | OKLCH token system intact, but hue-180 cyan leftovers in `catalog.css:451` and `decants.css:283` (the global sweep missed alpha-slash values). |
| 5 | Anti-patterns | 3/4 | The big slop items were fixed this session. Remaining: glassmorphism backdrop on `.fp__backdrop` (purposeful blur, borderline OK), and `transform: scale(1.03)` hover reflex on images. |
| **Total** | | **14.5/20** | **Good — address weak dimensions (a11y blockers in the detail-panel flow first).** |

### Anti-patterns verdict

Pass. The two slop grids (`comprar.html` format hub, `index.html` "Las Colecciones") were converted to asymmetric layouts this session; the duplicate AGOTADO badge and nav glassmorphism are gone. What remains reads as a brand site that has opinions, not as template work. Surviving template reflexes: `hover { transform: scale(1.03) }` on every image hover, the circular ochre `.to-top` FAB, and the `backdrop-filter: blur(3px)` on `.fp__backdrop` — all defensible, none blocking the verdict.

### Executive summary

- Audit Health Score: **14.5/20** (Good)
- Issue counts: **3 P0**, **8 P1**, **9 P2**, **5 P3**
- Top 5 critical:
  1. Detail-panel dialog never restores focus to its trigger on close, and has no focus trap inside (P0, a11y)
  2. `cat-entry__see` ("Ver →"), `fp__close`, `fp__step-btn`, and `fp__add-btn` are all under 44×44px (P0, a11y · WCAG 2.5.5)
  3. `index.html` heading hierarchy jumps h1 → h3 inside `.colls-intro` (P1, a11y · WCAG 1.3.1)
  4. Scripts `nav.js`/`scroll.js` loaded without `defer` and without `?v=` on `index.html`; version drift across pages (P1, perf · stale-JS risk)
  5. No `srcset`/`sizes` on any image — mobile downloads the desktop-sized 900×900 hero (P1, perf)

### Detailed findings

#### Accessibility

**[P0] Detail-panel focus is not trapped and never returns**
- **Location**: `src/scripts/catalogo.js:447-501` (`openPanel` / `closePanel`)
- **Category**: Accessibility
- **Impact**: A keyboard or screen-reader user opens the fragrance panel via "Ver →" and can tab out of the dialog back into the (visually obscured) catalog. On close, focus is lost — falls to `<body>` instead of returning to the Ver button that opened it. Per WCAG 2.4.3 and the ARIA Authoring Practices for `dialog[aria-modal=true]`, focus must be trapped and restored.
- **Standard**: WCAG 2.4.3 (Focus Order), WAI-ARIA dialog pattern
- **Recommendation**: In `openPanel(cardEl)`, capture `var trigger = cardEl.querySelector('.cat-entry__see') || document.activeElement;` and store it on `fpEl._returnTo`. Add a `keydown` Tab handler scoped to `fpEl` (same shape as `nav.js:31-49`) that cycles between first/last focusable elements. In `closePanel()`, call `fpEl._returnTo?.focus()`. Same pattern as the existing nav focus trap.

**[P0] Touch targets below 44×44px in the order flow**
- **Location**: `src/styles/catalogo.css:1114` (`.fp__close` = 32×32), `:1288` (`.fp__step-btn` = 30×30), `:1260` (`.fp__add-btn` ≈ 24×60), `:1340` (`.cat-entry__see` ≈ 28×56)
- **Category**: Responsive / Accessibility
- **Impact**: The entire order entry path on mobile sits below 44px. WCAG 2.5.5 (AAA) is the standard threshold; 2.5.8 (AA in WCAG 2.2, 24px floor) is borderline. On touch devices, "Ver →" and the +/− steppers are mis-tap magnets.
- **Standard**: WCAG 2.5.5 / 2.5.8
- **Recommendation**: `min-height: 44px; min-width: 44px;` on `.fp__close`, `.fp__step-btn`, `.fp__add-btn`. For `.cat-entry__see`, raise padding to `0.65rem 1rem` or add `min-height: 44px`. Visual size can stay smaller — pad the hit area.

**[P0] `cat-entry__see` button has no `aria-label` describing what it opens**
- **Location**: `src/scripts/catalogo.js:125`, `:249`
- **Category**: Accessibility
- **Impact**: Screen readers announce "Ver button" with no context — which fragrance, what happens? `aria-haspopup="dialog"` is present (good) but the button needs the fragrance name interpolated.
- **Standard**: WCAG 4.1.2 (Name, Role, Value)
- **Recommendation**: `<button class="cat-entry__see" type="button" aria-haspopup="dialog" aria-label="Ver detalles de ${name}">Ver →</button>`. Keep visible "Ver →" copy; name lives in the label.

**[P1] Heading hierarchy jumps h1 → h3 on `index.html`**
- **Location**: `src/pages/index.html:36` (h1 hero) → `:78`/`:92`/`:103` (h3 inside `.coll-block`)
- **Category**: Accessibility
- **Impact**: Screen-reader rotor users get a broken document outline. The hero h1 should be followed by an h2 for the next section. This was caused this session when "La colección." h2 was deleted as restated-heading slop — correct aesthetically, but the heading level on the children wasn't bumped.
- **Standard**: WCAG 1.3.1 (Info and Relationships)
- **Recommendation**: Either (a) reintroduce a visually-hidden h2 (`<h2 class="sr-only">Las colecciones</h2>`), or (b) promote the three `.coll-block__name` from h3 to h2. Option (b) is cleaner.

**[P1] Duplicate `id="faq-content"` on `faq.html`**
- **Location**: `src/pages/faq.html:123` (on `<main>`) and `:134` (on inner `<div>`)
- **Category**: Accessibility
- **Impact**: Invalid HTML; the skip-nav `#faq-content` target is ambiguous; assistive tech may land on the wrong element.
- **Standard**: WCAG 4.1.1 (Parsing — removed in 2.2, but duplicate IDs still cause practical issues)
- **Recommendation**: Drop the inner duplicate: `<div class="faq-body" id="faq-content">` → `<div class="faq-body">`. Main already has the id.

**[P1] `index.html` has no `<main>` landmark**
- **Location**: `src/pages/index.html:13-289`
- **Category**: Accessibility
- **Impact**: Screen-reader landmark navigation expects `<main>`. Every other page has it; the landing page jumps from `<nav>` straight to sibling `<section>` elements.
- **Standard**: WCAG 1.3.1, ARIA Landmark Roles
- **Recommendation**: Wrap hero + colls-intro + perfumista + sessions + process in `<main id="content" tabindex="-1">`. Update skip-nav `href` to `#content`.

**[P1] Skip-nav on `index.html` points to a non-focusable section**
- **Location**: `src/pages/index.html:15` (`href="#coleccion"`); target `<section id="coleccion">` has no `tabindex`
- **Category**: Accessibility
- **Impact**: Skip-nav works visually but programmatic focus doesn't land on a focusable target; some screen readers won't announce the target.
- **Standard**: WCAG 2.4.1 (Bypass Blocks)
- **Recommendation**: Add `tabindex="-1"` to the target, OR (better) implement the `<main>` fix above and target `#content`.

**[P1] Color contrast: `.coll-block--hybrid .coll-block__desc` borderline AA**
- **Location**: `src/styles/styles.css:753-755` — `oklch(58% 0.015 150)` on `var(--volcanic-ink)` (`oklch(18% 0.04 150)`)
- **Category**: Accessibility
- **Impact**: Contrast ratio ≈ 4.1:1 — fails WCAG AA for body text (needs ≥4.5:1).
- **Standard**: WCAG 1.4.3 (Contrast Minimum)
- **Recommendation**: Bump to `oklch(64% 0.018 150)` (the existing `--ink-deep` token, documented as ~4.8:1). Reference the variable instead of a literal.

**[P2] `<input type="search" id="cat-search">` has sr-only label and placeholder but no `aria-label`**
- **Location**: `src/pages/catalogo.html:75-77`
- **Category**: Accessibility
- **Impact**: The sr-only label is correct; the placeholder is a hint, not a label. Some screen readers verbose; not broken.
- **Recommendation**: No fix needed unless user testing flags verbosity.

**[P2] `.dc-tray__slot-remove` is ~24×30px**
- **Location**: `src/styles/decants.css:482-495`
- **Category**: Responsive / Accessibility
- **Impact**: Same touch-target class as the P0. Decant-remove × is hard to hit on phone.
- **Recommendation**: `min-height: 44px; min-width: 44px;` (visual `×` stays small inside the pad).

**[P2] "Las Colecciones" Hybrid block is a `<div>` while OB/IS are `<a>` — inconsistent structure**
- **Location**: `src/pages/index.html:72-107`
- **Category**: Accessibility
- **Impact**: The Hybrid's only action is the inner WhatsApp link (good); the outer block isn't a navigation target by design (acceptable). Inconsistency flagged so reviewer doesn't try to "fix" it.
- **Recommendation**: Accept as intentional variation.

**[P3] Footer has two `<nav>` elements; verify aria-labels distinguish them**
- **Location**: All footers
- **Impact**: Already correctly labeled: "Navegación del pie de página" and "Políticas y contacto". Good.

#### Performance

**[P1] No `srcset`/`sizes` on any image**
- **Location**: All `<img>` tags across all pages
- **Category**: Performance
- **Impact**: A mobile visitor downloads the full 900×900 (or 900×1200) PNG hero/coll images. The Citrus Enigma hero on `coleccion.html` is `loading="eager"` and ships full-res to a 375px phone. Wastes bandwidth, slows LCP.
- **Recommendation**: Generate 480w/768w/1200w variants and add `srcset="… 480w, … 768w, … 1200w" sizes="(min-width: 900px) 50vw, 100vw"`. Start with `hero-botanica.png` and the three coll-block images on `index.html` — biggest win.

**[P1] `nav.js` and `scroll.js` loaded without `defer` on `index.html`**
- **Location**: `src/pages/index.html:287-288`
- **Category**: Performance
- **Impact**: At end-of-body so they don't block render in practice, but `defer` is the documented best-practice and ensures execution after DOMContentLoaded (subtle race with the `IntersectionObserver` setup in `scroll.js` is possible).
- **Recommendation**: Add `defer` to both. Same on `coleccion.html`, `legal.html`, `faq.html` script tags.

**[P1] `?v=` cache-bust drift across pages**
- **Location**: `faq.html:11` uses `styles.css?v=21`; `legal.html:11` uses `styles.css` (no version); others use `?v=23`. Same for `scroll.js?v=19` on faq vs `?v=20` on coleccion vs unversioned on index.
- **Category**: Performance / Correctness
- **Impact**: A visitor moves index → faq and may load an older cached CSS, mixing tokens. Visual inconsistencies — and a CSS update could silently fail to reach faq users.
- **Recommendation**: Settle on one version per asset and bump together, or drop `?v=` and trust the SW's network-first.

**[P1] Service worker is network-first and caches every GET, including third-party**
- **Location**: `src/pages/sw.js:19-30`
- **Category**: Performance / Storage
- **Impact**: Every Google Fonts CSS/woff2 and any third-party image gets cloned and stored in `vency-admin-v3`. Storage grows unbounded; quota-constrained devices may hit eviction noise.
- **Recommendation**: Add a same-origin guard: `if (new URL(e.request.url).origin !== self.location.origin) return;` before the `caches.open`. Or use a separate `vency-runtime-v1` cache with an LRU cap.

**[P2] Google Fonts is render-blocking**
- **Location**: Every page `<head>`
- **Category**: Performance
- **Impact**: A render-blocking stylesheet on a third-party origin. URL has `display=swap` (good — fallback text shows immediately), but the stylesheet itself still blocks paint.
- **Recommendation**: Either (a) self-host Bitter + Manrope subsets in `src/assets/fonts/` with `@font-face { font-display: swap }`, or (b) keep Google Fonts but use async load: `<link rel="preload" as="style" href="…" onload="this.rel='stylesheet'">` with `<noscript>` fallback. Option (a) eliminates the third-party round-trip.

**[P2] Multiple CSS files on `catalogo.html` (5 files)**
- **Location**: `src/pages/catalogo.html:11-15`
- **Category**: Performance
- **Impact**: 5 HTTP requests before first paint. HTTP/2 mitigates but doesn't eliminate. Each `<link>` is render-blocking.
- **Recommendation**: Concatenate at build time. If no build step, accept — small files + HTTP/2 isn't catastrophic.

**[P2] `scroll.js` registers two separate scroll listeners**
- **Location**: `src/scripts/scroll.js:34, 44`
- **Category**: Performance
- **Impact**: Both `{ passive: true }` (good). Each reads `window.scrollY` (a layout read) every frame. Two listeners doing similar reads.
- **Recommendation**: Combine into one `rAF`-throttled handler that batches both classList toggles. Minor.

**[P3] `will-change: transform` on `.fp__sheet` is always set**
- **Location**: `src/styles/catalogo.css:1079`
- **Category**: Performance
- **Impact**: `will-change` permanently promotes a layer; minor memory cost while panel is hidden. Best practice: add/remove dynamically.
- **Recommendation**: Acceptable for a single panel. Leave.

#### Responsive

**[P1] `min-height: 100svh` on hero / `80svh` on colls-intro — no `vh` fallback**
- **Location**: `src/styles/styles.css:459, 599`
- **Category**: Responsive
- **Impact**: `svh` correctly excludes mobile browser chrome (better than `vh`). Browser support: Safari 15.4+, Chrome 108+. Older iOS without `svh` falls back to default (auto) and the section collapses to content height.
- **Recommendation**: Two-line fallback: `min-height: 100vh; min-height: 100svh;` (browser uses the second if supported). Same for `80svh`.

**[P2] `comprar.html` decant card flips to row-flex at ≥700px — verified correct**
- **Location**: `src/styles/comprar.css:54-89`
- **Category**: Responsive
- **Impact**: Image-left + body-right works for Decant; 30ml/100ml stack below. Card body has `padding: 2.5rem 2rem` (generous tap area).
- **Recommendation**: None.

**[P2] `.fp__sheet` uses `max-height: 92dvh`**
- **Location**: `src/styles/catalogo.css:1073`
- **Category**: Responsive
- **Impact**: `.fp__scroll` is the inner overflow region; longer narratives scroll inside. Verified.
- **Recommendation**: None.

**[P2] Asymmetric "Las Colecciones" at the 899/900px boundary**
- **Location**: `src/styles/styles.css:593-792`
- **Category**: Responsive
- **Impact**: At ≥900px the `1.7fr 1fr` grid renders; at ≤899px it collapses to single column. Hybrid block at mobile has `min-height: 200px` — may feel cramped at 320px viewports.
- **Recommendation**: Acceptable. If iPhone SE testing surfaces complaints, raise to 240px.

**[P3] Detail panel bottom-anchored on desktop too**
- **Location**: `src/styles/catalogo.css:1050-1057`
- **Category**: Responsive
- **Impact**: Intentional per design audit ("strong moment"). Verified works.
- **Recommendation**: None.

#### Theming

**[P2] Leftover hue-180 OKLCH values in `catalog.css` and `decants.css`**
- **Location**: `src/styles/catalog.css:451` (`oklch(18% 0.04 180 / 0.12)`), `src/styles/decants.css:283` (`oklch(30% 0.04 180 / 0.3)`)
- **Category**: Theming
- **Impact**: The global hue-180→150 sweep missed these because the regex matched `\b180\b\s*\)` and these have ` / 0.x)` (alpha-slash). Two surfaces now use a slightly cooler/cyan ink than the rest of the system.
- **Recommendation**: Regex `(oklch\([^)]*?)180(\s*[/)])` → replace with `$1150$2`. Catches alpha-slash and trailing-paren forms.

**[P3] No dark-mode strategy declared**
- **Location**: All stylesheets
- **Category**: Theming
- **Impact**: PRODUCT.md does not call for dark mode; brand ground is parchment, dark sections are intentional commitments. Acceptable to not support — should be documented.
- **Recommendation**: One-line top-of-file comment in `styles.css`: `/* Light-only by design — brand ground is parchment; dark sections are intentional commitments, not auto-flipped. */`.

#### Anti-patterns

**[P2] `transform: scale(1.03)` hover on all images**
- **Location**: `styles.css`, `comprar.css`, etc.
- **Category**: Anti-pattern (design audit C6)
- **Impact**: Template-reflex hover. Not banned, recognizable.
- **Recommendation**: Already in design audit deferred list. Optional polish.

**[P3] `.fp__backdrop` uses `backdrop-filter: blur(3px)`**
- **Location**: `src/styles/catalogo.css:1063`
- **Category**: Anti-pattern (glassmorphism)
- **Impact**: Design audit flagged this as "purposeful, not wallpaper" — it earns its place.
- **Recommendation**: None.

### Patterns & systemic issues

1. **Touch targets are systemically <44px in custom controls.** Five distinct buttons in the order/panel flow ship below WCAG threshold. A site-wide `--touch-min: 44px;` token plus `min-height: var(--touch-min); min-width: var(--touch-min);` on every `<button>` would close most of this.

2. **No `srcset` discipline.** Every `<img>` is single-resolution. The site loads as if every viewport is desktop.

3. **Script and style `?v=` strings drift independently per page.** Without a build step the version numbers will never be consistent. Either remove them and trust the SW, or write a one-line bump script.

4. **The detail-panel dialog is the highest-traffic interaction and lacks standard ARIA dialog plumbing** (focus trap, return-focus, escape). All three are 10–20 lines of JS; the pattern already exists in `nav.js`.

### Positive findings

- `prefers-reduced-motion` honored in JS (`scroll.js`, `carousel.js`) AND in CSS (entrance animation guards across `styles.css`, `catalogo.css`, `coleccion.css`, `admin.css`). Few sites get this right.
- Hero image is `loading="eager"` (correct LCP signal); coll-blocks and process images are `loading="lazy"`.
- Skip-nav exists on every page.
- Mobile nav has a proper focus trap, ESC handler, click-outside-to-close in `nav.js`.
- OKLCH-only color system with documented contrast ratios in token comments. Rare and disciplined.
- The catalog scroll cascade was capped at 8 entries this session — the bottom of Vency Atelier no longer waits 1.9s.
- `font-display=swap` in the Google Fonts URL (FOIT avoided).
- `<details>`/`<summary>` on FAQ uses native semantics — no JS, no fake-accordion drama.
- Every `<img>` has descriptive `alt` text (not generic "image").
- Hero h1 uses `<span>` masked-reveal without breaking screen-reader linearity.
- Every page uses `lang="es"`.

### Recommended actions

In priority order:

1. **[P0] `/impeccable harden src/scripts/catalogo.js`** — focus-trap, return-focus, and ESC handling on the `.fp` dialog. Same pattern as `nav.js:31-49`.
2. **[P0] `/impeccable adapt src/styles/catalogo.css`** — bump `.fp__close`, `.fp__step-btn`, `.fp__add-btn`, `.cat-entry__see` to `min-height: 44px; min-width: 44px;`.
3. **[P0] `/impeccable clarify src/scripts/catalogo.js`** — `aria-label="Ver detalles de ${name}"` on the `.cat-entry__see` buttons.
4. **[P1] `/impeccable adapt src/pages/index.html`** — wrap content in `<main id="content" tabindex="-1">`, promote `.coll-block__name` h3 → h2.
5. **[P1] `/impeccable optimize src/pages/*.html`** — add `srcset`/`sizes` to hero + coll-block images; add `defer` to all script tags; reconcile `?v=` cache-bust strings.
6. **[P1] `/impeccable harden src/pages/sw.js`** — same-origin guard before caching.
7. **[P1] `/impeccable adapt src/styles/styles.css`** — two-line `vh; svh` fallback on hero/colls; bump Hybrid desc color to `--ink-deep` for AA.
8. **[P2] `/impeccable polish src/styles/{catalog,decants}.css`** — sweep leftover hue-180 to hue 150.
9. **[P2] `/impeccable polish src/pages/faq.html`** — drop duplicate `id="faq-content"`.
10. **[P3] `/impeccable polish src/styles/styles.css`** — one-line dark-mode-not-supported comment.

> You can ask me to run these one at a time, all at once, or in any order you prefer.
>
> Re-run `/impeccable audit` after fixes to see your score improve.

---

## UX (user experience)

Fourth pass. Engineering, design, a11y/perf/responsive sections live above. This pass walks the actual flows — landing → first decant → WhatsApp sent — and flags where a user gets confused, slowed, or surprised. Severity: `blocker` (cannot complete), `friction` (slows / creates doubt), `polish` (small win), `delight` (chance to exceed expectations).

### Tier 1 — first-time-buyer friction (revenue impact)

1. **Decant concept is never explained.** `friction` · First time a visitor sees "decant" is on `comprar.html` or a fragrance row. PRODUCT.md treats it as a known noun. New customers in Costa Rica don't know what a 10 ml decant is. Fix: one short FAQ-style sentence on `comprar.html` directly under the Decant card — "Mini-frasco de 10 ml para probar antes de comprar el frasco completo" — and link to `faq.html#que-es-un-decant`. Add a corresponding FAQ entry if missing.

2. **Set-of-3 savings hidden until cart.** `friction` · The Decant card on `comprar.html` says "Un set de tres por ₡12.000" but doesn't show the implicit ₡3.000 discount vs ₡5.000 × 3. The carrot exists but isn't presented at the moment of decision. Fix: surface "Ahorrás ₡3.000 si llevás 3" as a sage-mineral footnote on the Decant card. Same line could appear in the detail panel when decant qty is 1 or 2.

3. **Two parallel "collection" pages (`coleccion.html` vs `catalogo.html`) confuse navigation.** `friction` · Nav has "Colección" → `coleccion.html` and "Comprar" → `comprar.html` → `catalogo.html`. Same fragrances, different layouts, different filter states. Users hitting "Colección" from nav see a different experience than the buy flow. Design audit flagged this strategically; UX impact: cart-add from `coleccion.html` does work, but the back-link goes to `catalogo.html` so you lose your place. Fix (cheapest): make "Seguir comprando" on `/carrito.html` use `document.referrer` so it returns to wherever you came from.

4. **No order-sent confirmation, no cart reset.** `blocker-adjacent` · After tapping "Enviar pedido por WhatsApp", the user lands in WhatsApp. They come back to the site → cart is still full, same VA####, no signal that anything happened. If they re-tap WhatsApp they send a duplicate; if they re-tap "Agregar a la orden" on another fragrance, it stacks on the prior order. Fix: when the WhatsApp link is tapped, mark the cart as `pending`. On next page-load (or `visibilitychange` return) show a `/carrito.html?sent=VA####` state — single line "Pedido VA#### enviado. Esperando tu comprobante." plus an "Empezar uno nuevo" button that clears the cart.

### Tier 2 — flow friction

5. **The order ref VA#### regenerates only when cart is non-empty, then sticks indefinitely.** `friction` · Returning after a week with the same VA#### means Tony could see two different orders with the same ref. Fix: include a `createdAt` timestamp in the localStorage cart; if older than 24 h, mint a new ref on next render.

6. **SINPE 3-step instructions appear before the user has committed to SINPE.** `friction` · The radio defaults to SINPE; the steps render below it. Users who want "Recoger en local" see the SINPE block first and might assume SINPE is required. The toggle hides the methods block correctly (already wired), but the cognitive load is real. Fix: lead with a one-line question above the toggle — "¿Cómo querés pagar?" — so the user knows they are choosing.

7. **"Agregar a la orden" semantics still ambiguous.** `friction` · The CTA at the bottom of the detail panel reads "Agregar a la orden". Recent feedback ("clicking it adds nothing") showed users do not expect it to default to a decant. Now that it adds + navigates to `/carrito.html`, the wording is slightly wrong: it is really "Ordenar este". Fix: rename to **"Ordenar este decant"** (or **"Agregar al pedido"** if the format depends on what the user picked) so the action matches the verb.

8. **Tray says "Ver carrito · ₡X" but disappears when scrolling fast on Vency section.** `polish` · Tray uses `transform: translateY` to slide; some mobile browsers drop the fixed-position element behind the scroll. Likely not reproducible on modern Chrome / Safari but worth a smoke test. Fix: if reports come in, switch to `position: sticky` inside a wrapper or add `will-change: transform`.

9. **"Vaciar carrito" link is small and underline-only.** `polish` · Below the WhatsApp CTA, easy to miss until you want it. Acceptable. But the *opposite* is more dangerous: it sits right next to a high-stakes action, and on mobile a thumb miss could clear the cart. The undo toast covers this, but a tiny confirm pause (double-tap or 2 s slide-in confirm button) would be safer than relying on undo.

### Tier 3 — sold-out items

10. **AGOTADO with no fallback affordance.** `friction → delight` · A user finds a fragrance, taps Ver, sees the AGOTADO badge in the rail and no way to act. Fix: add a "Avisarme cuando vuelva" link on sold-out rows that opens a pre-filled WhatsApp message — "Hola! Me interesa Citrus Enigma cuando vuelva al inventario." Zero backend needed. Brand voice stays artisan ("avisarme" not "notify me").

11. **No "restock soon" hint when admin marks low stock.** `polish` · Admin already tracks oil_ml per format. If `0 < oil_ml < threshold` (say 30 ml), show a quiet "Últimas unidades" on the rail. Encourages decisive purchase without manufacturing urgency.

### Tier 4 — edge cases users actually hit

12. **localStorage disabled / Safari private mode.** `friction` · Cart silently does not persist. User adds an item → navigates → cart is empty. They blame the site. Fix: feature-detect localStorage on init; if write throws, show a one-line bar at the top of `/carrito.html` and the floating tray: "Modo privado: tu carrito no se guardará si recargás." No crash, just honest.

13. **Network slow after WhatsApp tap.** `polish` · `target="_blank"` opens WhatsApp in a new tab; on slow mobile, that tab is blank for 1–2 seconds. The Vency tab is unchanged — the user might tap again. Fix: on click, disable the button for 2 s and swap label to "Abriendo WhatsApp…" before letting the new tab take over.

14. **Apps Script log POST fails silently.** `friction (for Tony, not the customer)` · If `SHEET_URL` returns an error, the user still completes WhatsApp checkout but Tony's sheet does not get the row. Tony has to manually reconcile. Already noted in engineering audit; UX impact: trust gap if Tony later asks "did your order come through?" Fix: keep a `vency_unsynced_orders` localStorage queue; retry on next visit; surface a tiny "Re-enviando registro" status only if Tony is the one viewing (Tony-mode flag).

### Tier 5 — trust / brand voice

15. **WhatsApp-as-checkout is the strongest brand alignment on the site.** `delight` · Most artisan / luxury sites apologize for not having Stripe. Vency confidently routes orders through a personal channel. Lean into it: the cart's confirm copy could say "Tony te responde en menos de una hora" (if true) — turn a perceived limitation into an artisan promise.

16. **No "thank you" moment after order placed.** `delight` · WhatsApp closes the loop *outside* the site. The opportunity: when user returns from WhatsApp, show a one-time card on `/carrito.html` — "Gracias por tu pedido VA####. Tony ya lo recibió." Pull from the same `pending` flag suggested in finding #4. Cheap, but the only emotional moment in the whole flow.

### Recommended fix order (impact ÷ effort)

| # | Fix | Impact | Effort |
|---|---|---|---|
| 4 + 16 | Order-sent state + thank-you on return | 🔴 high | M |
| 1 | Decant explainer on `comprar.html` | 🔴 high | XS |
| 2 | Set savings line at decision moment | 🟡 med | XS |
| 12 | localStorage disabled warning | 🟡 med | XS |
| 10 | "Avisarme" WhatsApp link on AGOTADO | 🟡 med | S |
| 3 | Smart "Seguir comprando" via referrer | 🟡 med | XS |
| 5 | Ref expiry after 24 h | 🟢 low | XS |
| 13 | WhatsApp tap throttle | 🟢 low | XS |
| 7 | Rename "Agregar a la orden" CTA | 🟢 low | XS |
| 6 | Pay-method preamble copy | 🟢 low | XS |
| 14 | Unsynced-order retry queue | (Tony only) | M |
| 11 | "Últimas unidades" hint | 🟢 low | S |
| 15 | "Tony responde en una hora" copy | 🟢 low | XS |

**One-sentence summary:** the buy flow now works mechanically end-to-end; the next round of wins is **closing the post-order loop** (findings 4 + 16) and **explaining what a decant is before the user has to guess** (finding 1).

---

## Audit refresh (consolidated)

Fifth pass · status-check. Spot-checks the fixes from the prior four passes and surfaces what the recent work introduced or left undone.

### Verdict per dimension

| Dimension | Was | Now | Note |
|---|---|---|---|
| Engineering (ponytail) | 17 findings, T1–T4 | T1–T3 cleared; **~200 lines of zombie code** remain (inline order panel + openPanel/closePanel/buildItems/syncPanel in `decants.js`, now unreachable after the tray-to-cart navigation switch). | Worth one sweep commit. |
| Design (impeccable) | All "slop" patterns flagged | All slop shipped: asymmetric grids, no glass, no em-dash, hue 150, hero distilled. | Open: drench-one-section per page, coleccion/catalogo IA. |
| A11y / Perf / Responsive | 14.5/20, 3 P0 + 8 P1 | P0s + most P1s done. **Hero LCP still ~1.5 MB PNG** — `build-images.js` exists but has not been run; no WebP files in tree yet. | Biggest perf win still pending. |
| UX | 16 findings, #1 + #4 highest impact | **#1 (decant explainer)** and **#4 (post-order state)** shipped this session. **Pending state has cross-page UX disconnects** — see findings below. | Closing the post-order loop is partial. |

### Verified-shipped checklist

- [x] AGOTADO double-render — single rail badge in both Vency and external paths
- [x] Em-dashes → `·` (no `—` in any rendered HTML / CSS content)
- [x] Hero distilled to headline + body + CTA (`index.html`)
- [x] `<main id="main">` + skip-nav target + sr-only h2 for heading order
- [x] `fetchpriority="high"` + `loading="eager"` on hero image
- [x] `defer` on every public-page `<script src=…>`
- [x] `decoding="async"` on every `<img>`
- [x] Dead `cat-sentinel`, `_catScrollLock`, `admin.min.js`: gone
- [x] Cart persistence (`vency_cart_v1`) + nav cart-link injected by `nav.js`
- [x] Detail panel focus trap + restore (catalogo.js)
- [x] 44×44 touch targets on `.fp__close`, `.fp__step-btn`, `.fp__add-btn`, `.cat-entry__see`
- [x] Tray label "Ver carrito · ₡X" → navigates to `/carrito.html`
- [x] `Vaciar carrito` in-page undo toast (no native `confirm()`)
- [x] Pending state with 24h TTL + visibilitychange re-render
- [x] "Empezar un pedido nuevo" wired to `clearAll()`
- [x] Decant explainer copy on `comprar.html` + FAQ anchor `que-es-un-decant`
- [x] EXEC_URL updated to new deployment across admin/decants/carrito

### New findings (ranked by impact)

1. **🔴 Nav cart badge ignores pending state** (`nav.js:80-91`). After the user taps WhatsApp, `pending` is set but the cart items remain. Nav badge still reads selection+bottles count → reads "Carrito 3" while `/carrito.html` reads "Pedido enviado." Same disconnect on the floating tray (`decants.js:307-312`): it still says "Ver carrito · ₡X". The post-order loop is leaky. Fix: both `readCartCount` and the tray label should check `state.pending` and, when present, either hide or show "Pedido VA#### enviado".

2. **🔴 Two competing display-scale moments on `/carrito.html` when pending.** `<h1>Carrito.</h1>` in `.carrito-header` always renders, plus `<p class="carrito-sent__ack">Pedido enviado.</p>` at near-h1 scale below. DESIGN.md "one strong thing per screen." Fix: when `state.pending` is active, hide `.carrito-header__title` (or swap to sr-only) and let "Pedido enviado." carry the page.

3. **🟡 "Empezar un pedido nuevo" button uses `.carrito__clear` styling** (`carrito.css:245-265`) — small underlined ink-muted text with red hover. That style means "danger / undo" elsewhere. After a "Pedido enviado." headline, this reads as "are you sure?" rather than the natural next move. Fix: introduce `.carrito-sent__new` styled as a quiet outline button (border, ochre text, ≥44px height) alongside Re-enviar.

4. **🟡 FAQ link `.fmt-card__faq` on comprar.html has no padding / min-height** (`comprar.css:171-181`). Plain `<a>` at `font-size: 0.78rem` inside a `<p>`. Tap target well under 44px. WCAG 2.5.5 — same rule we already enforced on cart buttons. Fix: `display: inline-block; padding: 0.6rem 0; min-height: 44px;` on the link (not the wrapping `<p>`).

5. **🟡 `coleccion.html` has no add-to-cart at all.** Loads `coleccion.js` but not `decants.js`, and renders no rail. A user browsing "Colección" from the top nav can't add anything — must navigate to `catalogo.html` first. Already flagged as IA overlap in design audit; this is the concrete UX cost. Fix path: either load `decants.js` on coleccion.html and add a rail, or rewrite the nav so "Colección" goes to `catalogo.html` and `coleccion.html` becomes a long-form editorial page (not a second catalog).

6. **🟡 Cart items remain editable in storage during pending state.** UI hides the form, so direct user mutation can't happen. But `addDecant`-via-URL-param (`decants.js` initFromUrl) could still mutate `vency_cart_v1` on page load while pending. Defensive fix: skip URL-param add when `pending` is set, OR auto-clear pending when any new add happens.

7. **🟢 Cache-stamp drift returned.** 32 references at `?v=51`, but `catalogo.js?v=52`, `carrito.js?v=4`, `carrito.css?v=2` are off-stream. Same pattern the audit already warned about. Bump everything to a single `?v=52` (or higher) in the next commit so future-you doesn't ship inconsistent JS combos again.

8. **🟢 `build-images.js` shipped but not run.** No WebP files exist on disk; `<img>` tags still point at original PNGs averaging 1.5 MB. The single biggest perf win on the audit is queued behind one `npm i sharp && node build-images.js`.

9. **🟢 Zombie code from the tray-redirect refactor.** `decants.js` still defines `openPanel`, `closePanel`, `buildItems`, `syncPanel`, `getSelectedDelivery`, the waBtn handler, and the delivery-toggle wiring (~150 lines). The DOM panel they target (`#dc-order-panel` in `catalogo.html`, ~70 lines) is also dead. None of it runs anymore — the tray click goes straight to `/carrito.html`. Safe deletion, ~200 line drop.

### Top 5 next moves (impact ÷ effort)

| # | Move | Closes | Effort |
|---|---|---|---|
| 1 | **Pending-aware nav badge + tray label** | Finding #1 above; finishes the UX #4 loop | XS |
| 2 | **Hide `Carrito.` h1 + restyle "Empezar nuevo" button when pending** | Findings #2 + #3 | XS |
| 3 | **`build-images.js` run + wire `<picture>` srcset** | Audit's largest remaining perf gap | M (one-time) |
| 4 | **Sweep zombie order-panel code** from `decants.js` + `catalogo.html` | Finding #9; ~200 lines removed | S |
| 5 | **Cache-stamp resync + `.fmt-card__faq` tap target** | Findings #4 + #7; both XS | XS |

**One-sentence summary:** UX #4 shipped but only halfway — the post-order signal is correct on `/carrito.html` and invisible everywhere else; the next 10 minutes of work is teaching the nav badge and the floating tray about `pending`.
