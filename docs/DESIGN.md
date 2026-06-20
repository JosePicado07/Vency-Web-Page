<!-- SEED: re-run /impeccable document once there's code to capture the actual tokens and components. -->

---
name: Vency Atelier
description: Artisan perfumery from Costa Rica. Small-batch fragrances crafted for those who seek the extraordinary.
---

# Design System: Vency Atelier

## 1. Overview

**Creative North Star: "The Volcanic Garden"**

Vency Atelier does not sell fragrance. It documents a place. Each composition is a record of specific materials: sourced from independent suppliers, grown in particular soils, gathered in particular seasons. The visual system carries that specificity. Every color is named after a material. Every layout decision should ask: does this look like it was made by someone who knows exactly what they are doing?

The palette is a four-role system anchored in Costa Rican natural materials: volcanic ink for structure, botanical parchment for ground, warm ochre for secondary warmth, sage mineral for botanical accent. Typography builds contrast through letterform geometry: a confident slab serif for proclamations, a warm humanist sans for everything that must be read at length. Motion is choreographed but unhurried — the page reveals itself in waves, the way a fragrance dries down in stages, never all at once.

This system explicitly rejects the aesthetics of its competitors. Department-store perfumery (white surfaces, grid layouts, lifestyle photography of faces) is forbidden. Maximalist luxury ornamentation (gold, baroque borders, logomania) is forbidden. Startup conversion logic (gradient CTAs, card grids, social proof statistics) is forbidden. Generic e-commerce orthodoxy (Shopify breadcrumbs, add-to-cart as the dominant visual element) is forbidden. What remains is specific, material, Costa Rican, and made by hand.

**Key Characteristics:**
- Full four-color palette, every role named after a material found in the Costa Rican natural world
- Slab serif (Bitter) and humanist sans (Manrope) paired by letterform contrast, not weight tricks
- Choreographed, scroll-driven entrances paced at the speed of a drying fragrance
- Narrative leads; product follows — no fragrance appears without its story
- Volcanic geological specificity in every color name, copy choice, and layout decision

## 2. Colors: The Material Palette

The palette names four things from the Costa Rican landscape. No filler colors. Every role earns its place by naming something real.

**Color strategy: Full palette.** Three to four named roles, each deliberate. The palette is not a mood board; it is a set of materials.

### Primary

- **Volcanic Ink** (to be resolved during implementation — deep near-black with trace green-mineral chroma, OKLCH target: ~l=18% c=0.04 h=180): The structural color. Used for all body text, primary navigation, primary button fill, section dividers. This is not pure black. It carries a trace of the volcanic mineral world in its undertone — readable as near-black, but distinctly alive.

### Secondary

- **Warm Ochre** (to be resolved during implementation — earthy mid-tone warm amber, OKLCH target: ~l=55% c=0.10 h=55): The secondary warmth. Used for secondary CTA states, fragrance category labels, highlighted ingredient metadata. Named for dried tropical hardwood and volcanic ochre clay.

### Tertiary

- **Sage Mineral** (to be resolved during implementation — muted botanical green with real chroma, OKLCH target: ~l=48% c=0.10 h=145): The botanical accent. Used sparingly: one accent element per major section. Named for the mineral-green undergrowth of a Costa Rican cloud forest.

### Neutral

- **Botanical Parchment** (to be resolved during implementation — warm off-white, trace chroma toward the ink tone, OKLCH target: ~l=95% c=0.007 h=90): The page ground. All body surfaces use this, not white. Named for dried botanical paper.
- **Atelier Stone** (to be resolved during implementation — mid-tone warm neutral, OKLCH target: ~l=75% c=0.005 h=80): Borders, dividers, muted secondary text. Named for the volcanic stone of the Meseta Central.

### Named Rules

**The Provenance Rule.** Every color in the system must have a material name. "Primary" is not a color name in this system. "Volcanic Ink" is. The names keep implementation decisions honest — if a new color cannot be named after something in the Vency world, it should not be added.

**The No Ambient White Rule.** Pure white (#fff or oklch(100% 0 0)) is prohibited on any surface. The lightest ground color is Botanical Parchment with trace chroma. Blank clinical surfaces are the first thing this system explicitly refuses to be.

**The Scarcity Rule.** Sage Mineral appears once per section, at most. Its rarity is what makes it register. If it appears five times on a page, it is no longer a botanical accent — it is wallpaper.

## 3. Typography: The Atelier Voice

**Display / Headline Font:** Bitter (slab serif, Google Fonts, available in weights 400-900)
**Body Font:** Manrope (humanist-geometric sans, Google Fonts, available in weights 200-800)
**Label / Metadata Font:** Manrope, uppercase, tracked (no third font required)

**Character:** Bitter's bracketed slab serifs read as precise, archival, and confident — the typography of someone who labels their materials carefully and knows their sources. Manrope brings genuine warmth and open apertures without genericness; it reads as articulate, not corporate. Together they contrast through letterform geometry (bracketed serifs versus open curves), not through the lazy serif-versus-thin-sans pairing that fills every artisan brand website. Neither font appears on the reflex-reject list.

### Hierarchy

- **Display** (Bitter, weight 900, `clamp(3.5rem, 9vw, 7.5rem)`, line-height 0.9, no letter-spacing adjustment): One statement per page-section. The name of a fragrance. A single proclamation. Never two display elements competing at the same scale.
- **Headline** (Bitter, weight 700, `clamp(2rem, 5vw, 3.75rem)`, line-height 1.0): Section openers, fragrance collection headings, major narrative beats.
- **Title** (Manrope, weight 600, `clamp(1.25rem, 3vw, 2rem)`, line-height 1.2): Subsection labels, navigation links, fragrance sub-category names.
- **Body** (Manrope, weight 400, `1rem` / `1.125rem`, line-height 1.7, max 65ch): All narrative prose. The line length cap at 65ch is not optional — long lines undermine the unhurried reading pace this system requires.
- **Label** (Manrope, weight 500, `0.7rem`, letter-spacing 0.12em, ALL CAPS): Ingredient lists, batch numbers, material origins, provenance metadata. The voice of a ledger.

### Named Rules

**The One Proclamation Rule.** Display type appears once per section. If two elements are announcing themselves at Display scale, neither is heard. This rule is not a suggestion — it is the reason the display size is this large.

**The Ingredient Label Rule.** All provenance data (origin country, batch identifier, raw material list) uses the Label style exclusively: uppercase, tracked, Manrope. This is not body text. It is ledger text. The distinction in typographic voice communicates that these details are evidence, not marketing copy.

**The No Flat Scale Rule.** The ratio between adjacent type steps must be at least 1.3. A flat scale (all sizes within 20% of each other) signals that no one made a decision about hierarchy. Vency's typography makes decisions.

## 4. Elevation

Flat by default. The system does not use drop shadows to create depth. Depth is created through color contrast: Volcanic Ink on Botanical Parchment creates all the separation the system needs. Surfaces are differentiated by their material color (ink sections vs. parchment sections vs. ochre accents), not by shadows underneath them.

The one exception is imagery treatment: hero photography may use a CSS `filter: brightness(0.85) contrast(1.1)` to ground imagery in the overall palette. This is a color-space adjustment, not an elevation effect.

### Named Rules

**The No Shadow Rule.** Drop shadows are prohibited. If an element needs visual separation, the answer is a color change, a border using Atelier Stone, or a change in background surface. Shadows read as polished and generic — the two things this system refuses to be.

## 5. Components

*Omitted — no components implemented yet. Re-run `/impeccable document` once the codebase has HTML and CSS to extract.*

When components are documented, prioritize: primary and ghost buttons, navigation (desktop and mobile), fragrance presentation unit (the primary repeating element), ingredient/provenance metadata block, section dividers.

## 6. Do's and Don'ts

### Do:

- **Do** name every color after a material in the Costa Rican or botanical world. If you cannot name it, do not add it.
- **Do** lead with narrative on every fragrance section: the story opens before the name appears. Product follows context.
- **Do** use choreographed scroll-driven entrances paced at 600-900ms per element with `cubic-bezier(0.16, 1, 0.3, 1)` easing (ease-out-expo). The timing should feel like something settling, not something snapping.
- **Do** treat provenance metadata (origin, batch, ingredients) as a distinct typographic voice: Manrope uppercase Label, always tracked. Never styled like body copy.
- **Do** scale Display type aggressively: one Bitter weight-900 proclamation per section, competing with nothing.
- **Do** vary the proportions and arrangement of each fragrance presentation unit. No two fragrance entries should have the same visual weight or layout.
- **Do** use `clamp()` for all type sizes and most spacing values. The layout should breathe on large viewports and compress gracefully on mobile without breakpoint gymnastics.
- **Do** respect `prefers-reduced-motion`: all choreographed entrances fall back to a simple `opacity` fade at 300ms with no transform.
- **Do** use Botanical Parchment (not white) as the lightest ground color, always.
- **Do** test the Color Scarcity Rule: count how many times Sage Mineral appears per page. If it exceeds one per major section, reduce.

### Don't:

- **Don't** use department-store perfumery conventions: pure white backgrounds, hero-to-grid layouts, lifestyle photography of people wearing fragrance, or counter-display visual polish. This is an atelier, not a department store.
- **Don't** use maximalist luxury ornamentation: heavy gold, baroque borders, decorative scrollwork, logomania, or the visual vocabulary of Versace or Dolce & Gabbana. The craft is the statement; decoration would undercut it.
- **Don't** use startup or SaaS visual logic: gradient CTAs, conversion-first layouts, "Join 10,000 customers" social proof, grid-of-cards with icon-heading-body structure, or rounded-corner icon badges above headings.
- **Don't** use generic e-commerce patterns: breadcrumb navigation, standard product-grid rows, star ratings as a primary element, or "Add to Cart" as the dominant visual action on any section.
- **Don't** use editorial-magazine typography: italic display serif drop caps, broadsheet column grids, ruled separators between columns, or the aesthetic family of Klim-influenced specimen pages. This lane is explicitly banned.
- **Don't** use drop shadows anywhere in the layout. Depth is color, not atmosphere.
- **Don't** use pure white (#fff / oklch(100% 0 0)) as any surface color.
- **Don't** repeat identical card proportions in a grid. Each fragrance presentation must differ in layout proportion or compositional arrangement from its neighbors.
- **Don't** animate CSS layout properties (width, height, padding, margin). Transition only transform and opacity.
- **Don't** let the Sage Mineral accent appear more than once per major section. Scarcity is the mechanism.
- **Don't** use the reflex-reject fonts: no Fraunces, Newsreader, Lora, Crimson, Playfair Display, Cormorant, Syne, IBM Plex, Space Mono, Space Grotesk, Inter, DM Sans, Plus Jakarta Sans, Instrument Sans.
