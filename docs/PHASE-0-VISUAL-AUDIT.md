# Phase 0 — Visual Identity & Design Cohesion Audit
**Date:** 2026-06-16  
**Method:** Playwright screenshots · 1440px desktop + 390px mobile · all 4 pages  
**Focus:** Visual quality, brand cohesion, premium perception only

---

## The Core Finding — Two Visual Languages

The site does not feel like one brand. It operates in two completely different visual registers:

**Register 1: Editorial Atelier** (Decants, Coleccion)  
Full photography. Generous whitespace. Large display type. Per-fragrance color identity. Dark/light alternation for rhythm. Gradient image overlays. Feels: premium, artisanal, Costa Rican, distinctive.

**Register 2: Generic Web UI** (Catalog, Homepage below the fold)  
No photography. Dense content rows. Small filter pills. Uniform parchment backgrounds. No color drama. Feels: functional, anonymous, could belong to any brand.

A user who navigates Decants → Coleccion feels they are inside a singular, confident atelier. A user who then opens Catalog feels they've been redirected to a different company's product index. This is the biggest visual problem on the site.

---

## Visual Consistency Scores

| Page | Brand Identity | Visual Hierarchy | Layout Quality | Mobile | Premium Perception | **Total** |
|---|---|---|---|---|---|---|
| **Decants** | 10 | 9 | 9 | 8 | 10 | **46/50** |
| **Coleccion** | 9 | 8 | 9 | 8 | 9 | **43/50** |
| **Homepage** | 6 | 6 | 6 | 7 | 6 | **31/50** |
| **Catalogo** | 3 | 4 | 4 | 2 | 3 | **16/50** |

---

## Page-by-Page Analysis

### Decants — The Standard Bearer (46/50)

This is the best page on the site. The full-bleed 2×3 photography grid with per-fragrance color identity is genuinely distinctive — it could belong to a premium niche house in Paris or Amsterdam. Each block creates its own olfactory world:

- Citrus Enigma: warm golden botanicals
- Vency Rouge: deep burgundy, candlelit
- Infusión Carmesí: saturated red florals, theatrical
- Tabaco y Miel: amber tobacco, warm interior
- Ventisca: cold blue mountain light, expansive
- Resina Dorada: amber gold, resinous depth

The gradient text overlays are handled well — legibility over imagery without killing the mood. The "Arma tu set." header is the strongest copy on the site — direct, confident, brand-appropriate.

**What makes it work:**
- Photography is the primary visual language, not decoration
- Per-fragrance color blocking creates rhythm without repetition
- Dark/light alternation is editorial, not arbitrary
- The format rail (DECANT · FRASCO) sits quietly beneath each block — functional without intruding

**Weaknesses:**
- The filter element at top-right of the grid is nearly invisible — its visual weight is inconsistent with the premium grid below it
- On mobile, the stacking is good but the format rail buttons feel cramped

---

### Coleccion — Premium But Falters at the Entrance (43/50)

The editorial alternating-split layout is excellent — each fragrance gets its own world. The rhythm of left-image/right-text then right-image/left-text, combined with alternating dark and light section backgrounds, creates genuine visual momentum. The typography is doing its job: large Bitter 900 for fragrance names, Manrope body, and the tracked uppercase labels for category and format.

Specifically strong: the Vency Rouge and Infusión Carmesí entries use dark section backgrounds that give these fragrances genuine drama. The contrast with the lighter Citrus Enigma and Resina Dorada entries creates exactly the right variation.

**The entrance problem:**  
The page header section ("Seis composiciones. Tres formatos.") has a large vertical gap between the subtitle and the filter pills, and another gap between the filter pills and the first fragrance entry. The filter pills look like decorative separators, not an interactive system. A user who doesn't know to look for filters will miss them entirely. The entrance experience does not match the editorial quality of the content below.

**Weaknesses:**
- Filter pills are visually equivalent to content labels — same font, same scale, same weight. Interactive elements must be distinguishable from static ones.
- The gap between the page header and first fragrance entry creates a stall point — the visual momentum collapses before the fragrances begin.
- The header body copy ("Esta página…") is useful text but its position creates an awkward block between the title and the fragrances.

---

### Homepage — Strong Opening, Degrades Fast (31/50)

The hero is the best single section on the entire site: "Historias olfativas. Hechas a mano." in Bitter 900, set against the botanical photograph, communicates the brand in under one second. It is clear, premium, and distinctly Costa Rican.

Below the fold, the visual quality degrades in three identifiable stages:

**Stage 1 — Collections Grid: Mixed**  
The Original Blend and Icon Series panels are working — editorial photography in contained blocks, strong labels, short copy, clear CTAs. But the Hybrid panel is a solid dark rectangle with centered text and a WA link. No texture, no image treatment, no typographic visual interest. In a three-column grid where two panels have rich atmospheric photography, the third looks like an unstyled placeholder or a broken image. This is the homepage's most damaging visual moment.

**Stage 2 — Perfumista Section: Acceptable**  
The text-left / image-right editorial split is clean and well-proportioned. The section doesn't reach the visual heights of the Coleccion editorial entries, but it reads as competent and brand-consistent.

**Stage 3 — Sessions and Process: Generic**  
"Una hora con Anthonny" is centered text on parchment with a ghost button. There is no imagery, no atmospheric element, no visual anchor. This section could belong to a yoga booking service or a cooking class. The word "Sesiones" appears nowhere in the design vocabulary of the rest of the site.

The Process section (01 · OBTENCIÓN, 02 · MEZCLA, 03 · EMBOTELLADO) reads like a "How It Works" section from a SaaS startup. The numbered labels in small ochre uppercase text and the tightly contained images reduce artisanal craft to a three-step flowchart. This is the most visually generic section on the entire site.

**Visual flow summary:**  
Hero (atelier) → Collections (mixed) → Perfumista (acceptable) → Sessions (generic) → Process (SaaS) → Footer

The page opens as a premium atelier and ends as a generic informational website.

---

### Catalogo — Broken Visual Identity (16/50)

This page does not feel like Vency Atelier. It feels like a different company's product catalog.

The fundamental problem is structural: the page has no photography, no editorial framing, and no visual storytelling. It is 100+ rows of text entries — fragrance name, brand, a color dot, and a WA link. The background colors (parchment for Diseñador, slightly lighter for Nicho, volcanic ink for Ultra Nicho) create some section differentiation, but they cannot compensate for the complete absence of visual interest.

**What makes this so damaging:**  
A user who enters from Decants or Coleccion — where the brand's visual identity is at its strongest — and then navigates to Catalogo experiences a total brand collapse. The contrast between "Ventisca" (a full-bleed icy mountain photograph with the fragrance name in large Bitter against a gradient overlay) and a text row reading "Silver Mountain Water · Creed · unisex dot · Solicitar →" is not just a visual step down. It signals to the user that this part of the site was designed differently, possibly by a different team, possibly with a different brief.

**The Ultra Nicho section is actually the strongest visual moment on the catalog page.** The dark volcanic ink background with light text creates drama and differentiation. This approach — treating each major section category as a distinct visual environment — is correct. It's just not taken far enough.

**The Vency Collections banner** (three small text panels above the filter bar) is nearly invisible. At thumbnail scale it reads as three columns of text with arrows. It does not register as a brand orientation moment. Its purpose is correct (provide collection context for direct-entry users), but its execution has no visual weight.

**Mobile performance:** 24,270px of text on a 390px screen. No imagery. No visual relief. This is the weakest mobile experience on the site by a significant margin.

---

## Comparative Analysis

### Strongest Visual Page: Decants

The 2×3 photography grid with per-fragrance color identity is the visual system that best represents what Vency Atelier is. The photography is the content. The typography frames it. The color blocking creates rhythm. Every element serves the fragrance narrative. This is what every page should aspire to.

### Weakest Visual Page: Catalogo

Not because of bad execution within its chosen visual register, but because its chosen visual register — dense text list — is incompatible with the brand identity expressed everywhere else on the site. The page has high functional value but zero visual identity value.

### Components Worth Standardizing (The Design Foundation)

| Component | Source | Why it should be the standard |
|---|---|---|
| Full-bleed editorial block | Decants `.dblock` | Strongest brand expression; photography as content |
| Alternating editorial split | Coleccion `.catalog-entry` | Premium rhythm, each entry a world |
| Per-section dark/light alternation | Coleccion dark sections | Creates drama without new photography |
| Bitter 900 display proclamation | Every page hero | The most recognizable brand signal |
| Tracked uppercase Manrope label | Every page | Consistent provenance voice |
| Gradient text overlay on photography | Decants overlays | Allows dark + text on image without killing the mood |

### Components That Should Be Removed or Redesigned

| Component | Location | Problem |
|---|---|---|
| Hybrid placeholder block | Homepage collections grid | Solid dark rectangle with text looks broken alongside photography |
| Sessions section (current state) | Homepage | Zero visual character; no imagery, no atmosphere |
| Process section (current state) | Homepage | SaaS "How It Works" — generic and cold |
| Vency Collections banner | Catalogo | No visual weight; fails its purpose of brand orientation |
| Filter pills at current size | Coleccion, Catalogo | Indistinguishable from content labels visually |

---

## Visual Debt Report

**Debt 1: Catalog is outside the design system.**  
The catalog page uses the typography and color system correctly but has no photography, no editorial framing, and no visual hierarchy beyond text size differences. It reads as a database export formatted with brand fonts, not as a designed page. Every other page treats imagery as the primary visual layer. The catalog treats imagery as absent.

**Debt 2: The homepage loses the brand below fold one.**  
The hero is excellent. The collections grid is the first degradation point (Hybrid block). By the Sessions section the visual register has fully collapsed into generic web content. The homepage should sustain the atelier identity end-to-end — currently it only sustains it for the first viewport.

**Debt 3: Image treatment has no unified system.**  
Four different image treatments exist across the site:
1. Full-bleed with gradient overlay (Decants) — premium
2. Editorial split with contained image, alternating side (Coleccion) — premium
3. Contained rectangular image in a 3-column grid block (Homepage collections) — adequate
4. No image (Catalog) — brand breakdown

There is no image system. There are four ad hoc approaches. The first two are excellent. The third is acceptable. The fourth breaks the identity.

**Debt 3: The Hybrid "coming soon" treatment undermines the homepage's authority.**  
A blank dark block next to two image-rich blocks signals incompleteness. A brand that does not yet have a product line should either not feature it, or feature it in a way that builds anticipation rather than exposing the gap.

**Debt 4: Filter pills are visually identical to content labels.**  
The same Manrope uppercase tracking is used for interactive filter pills and for static content labels. Interactive elements must signal their interactivity without relying on hover state alone. On mobile — where hover doesn't exist — these look like text, not buttons.

**Debt 5: The Sessions and Process sections are legacy content in a visual language that predates the current design intent.**  
These sections use the same basic structure (text block on parchment, one CTA) without the editorial ambition that Decants and Coleccion demonstrate. They were likely designed before the visual identity crystallized around the full-bleed editorial model.

---

## Design System Recommendations

**Canonical visual standard: Decants + Coleccion**  
The visual language defined by these two pages is the standard. Any new page, section, or component must ask: would this feel at home between Ventisca and Resina Dorada? If not, it needs to be redesigned.

**Image rule:** Every significant section of the site should have photography as a primary visual layer, not an optional decoration. The only pages exempt are utility pages (legal, contact) where the content IS the product.

**Dark section rule:** The alternation between volcanic-ink-background and botanical-parchment-background sections is the primary rhythm mechanism of the site. It should be applied more consistently — including in Sessions and Process on the homepage, and in the catalog section headers.

**Typography rule:** Bitter 900 display proclamations must appear at least once per major section. The Sessions section and Process section currently have no display-scale text. The catalog section headers (Diseñador, Nicho, Ultra Nicho) are too small.

---

## Phase 0 Action List

Ranked by visual impact. All fixes are purely visual — no structural or IA changes.

### Tier 1 — Critical (brand identity breaks)

**V-01: Hybrid block visual treatment**  
*File: `src/styles/styles.css` (`.coll-block--hybrid`)*  
The solid dark rectangle needs at least one visual element to feel intentional. Options ranked by effort:
- A: Large Bitter display text as background watermark — e.g. "∞" or "—" at 20vw, opacity 0.07
- B: A CSS botanical texture (subtle radial gradient with warm ochre trace)
- C: A grayscale version of an existing fragrance photograph, heavily desaturated and darkened
Start with A — zero new assets, maximum impact.

**V-02: Catalog section headers at display scale**  
*Files: `src/styles/catalogo.css`, `src/scripts/catalogo.js`*  
"Diseñador", "Nicho", and "Ultra Nicho" section headers must be much larger. Currently they read as content labels. They should be Bitter 700 at 3–4rem, with 80–100px of vertical breathing room above and below. The Ultra Nicho section already has the right dark background — expand this treatment by making the header monumental.

**V-03: Sessions section visual anchor**  
*File: `src/pages/index.html`, `src/styles/styles.css`*  
This section needs one anchoring visual element. The options without new photography:
- A: A large Bitter pull-quote styled fragment: "Una hora. Sus materias primas. Su oficio. El tuyo." at display scale, centered, behind the body copy
- B: A botanical decorative element (CSS or existing SVG asset)
- C: Repurpose one of the process images as a full-width header image for this section
Start with A.

### Tier 2 — High Impact (visual register consistency)

**V-04: Process section redesign**  
*File: `src/pages/index.html`, `src/styles/styles.css`*  
The numbered list format is too generic. The step numbers (01, 02, 03) should be rendered in Bitter 900 at large scale — treated as a design element, not a label. The step images should be at least 50% wider than their current containers. Consider making each step alternate dark/light backgrounds like the Coleccion entries.

**V-05: Filter pills visual differentiation from content labels**  
*Files: `src/styles/catalogo.css`, `src/styles/catalog.css`*  
Pills need a resting state that reads as "interactive button," not "text label." At rest: add a visible border (1px solid `var(--border)`) and a slight background tint. The active/selected state is already correct (volcanic ink fill). Also increase size — see the technical audit for exact dimensions.

**V-06: Catalog entry section headers — scale and drama**  
*File: `src/scripts/catalogo.js`, `src/styles/catalogo.css`*  
Each of the three catalog sections (Diseñador / Nicho / Ultra Nicho) needs a visual threshold moment — not just a background color change and a small header. The section name should appear in Bitter 900 at `clamp(3rem, 8vw, 7rem)` with the fragrance count and a generous top/bottom spacing. This transforms a text list into a curated journey through three different perfumery worlds.

### Tier 3 — Polish (visual coherence)

**V-07: Homepage collections grid — image treatment alignment**  
*File: `src/styles/styles.css` (`.coll-block__img-wrap`)*  
The contained rectangular images in the OB and IS coll-blocks use a different image treatment from Decants (full-bleed) and Coleccion (editorial split). They look like thumbnail previews. Consider: making the image fill the entire top half of each coll-block (remove the padding/margin around the image-wrap) so the coll-block is more immersive.

**V-08: Vency Collections banner on Catalogo — increase visual authority**  
*File: `src/styles/catalogo.css` (`.vency-collections`)*  
The three-panel banner has the right concept but too little visual weight. Increase the panel height, make the collection names much larger (Bitter 700, at least 1.5rem), and add a clear visual separation from the filter bar below.

**V-09: Perfumista section — reduce static feel**  
*File: `src/pages/index.html`, `src/styles/styles.css`*  
The two-column layout (text left, image right) is correct but feels inert compared to the Coleccion editorial entries. Consider adding the per-section dark background alternation here — a volcanic ink background under the Perfumista section would make the image more dramatic and create the kind of dark/light rhythm that makes Coleccion so compelling.

---

## Summary

| Fix | Visual impact | Effort | Files |
|---|---|---|---|
| V-01 Hybrid block watermark | Critical | Low (CSS only) | styles.css |
| V-02 Catalog section headers at display scale | Critical | Low (CSS + JS) | catalogo.css, catalogo.js |
| V-03 Sessions visual anchor | Critical | Low (HTML + CSS) | index.html, styles.css |
| V-04 Process section redesign | High | Medium | index.html, styles.css |
| V-05 Filter pills resting state | High | Low (CSS only) | catalogo.css, catalog.css |
| V-06 Catalog section thresholds | High | Medium (CSS + JS) | catalogo.css, catalogo.js |
| V-07 Coll-block image fill | Medium | Low (CSS only) | styles.css |
| V-08 Collections banner scale | Medium | Low (CSS only) | catalogo.css |
| V-09 Perfumista dark background | Medium | Low (HTML + CSS) | index.html, styles.css |

**Execute order: V-01 → V-03 → V-02 → V-06 → V-05 → V-04 → V-07 → V-08 → V-09**

The first three fixes address the most damaging visual identity breaks. Execute those first, re-screenshot, then proceed.
