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
