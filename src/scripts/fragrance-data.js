/**
 * Vency Atelier — Shared fragrance catalog data
 * Add new entries here to grow the catalog; both coleccion and decants consume this.
 */
(function (root) {
  root.VENCY_CATALOG = [
    {
      id: 'citrus-enigma',
      name: 'Citrus Enigma',
      category: 'original-blend',
      categoryLabel: 'ORIGINAL BLEND',
      notes: ['citrus', 'limon', 'pina', 'madera-blanca', 'almizcle'],
      noteLabels: ['Citrus', 'Limón', 'Piña', 'Madera blanca', 'Almizcle'],
      ocasion: ['diario', 'verano'],
      ocasionLabels: ['Diario', 'Verano'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'La promesa de algo que nunca fue completamente dulce.',
      image: '../assets/images/originals/citrus-enigma.png',
      characterColor: 'oklch(72% 0.09 135)',
      inspiration: null,
      featured: false
    },
    {
      id: 'vency-rouge',
      name: 'Vency Rouge',
      category: 'original-blend',
      categoryLabel: 'ORIGINAL BLEND',
      notes: ['rosa', 'especias', 'cedro', 'ambar', 'musgo'],
      noteLabels: ['Rosa de Damasco', 'Especias cálidas', 'Cedro', 'Ámbar', 'Musgo'],
      ocasion: ['noche', 'formal'],
      ocasionLabels: ['Noche', 'Formal'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'Un perfume que sabe exactamente lo que es.',
      image: '../assets/images/originals/vency-rouge.png',
      characterColor: 'oklch(38% 0.10 8)',
      inspiration: null,
      featured: true
    },
    {
      id: 'infusion-carmesi',
      name: 'Infusión Carmesí',
      category: 'original-blend',
      categoryLabel: 'ORIGINAL BLEND',
      notes: ['cereza', 'hibisco', 'rosa', 'resina', 'vetiver'],
      noteLabels: ['Cereza oscura', 'Hibisco', 'Rosa', 'Resina', 'Vetiver'],
      ocasion: ['diario', 'fin-de-semana'],
      ocasionLabels: ['Diario', 'Fin de semana'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'Carmesí no como color sino como estado.',
      image: '../assets/images/originals/infusion-carmesi.png',
      characterColor: 'oklch(36% 0.10 350)',
      inspiration: null,
      featured: false
    },

    /* ── ICON SERIES ───────────────────────────────────────── */
    {
      id: 'absolu-authority',
      name: 'Absolu Authority',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['pina', 'pomelo', 'especias', 'maderas'],
      noteLabels: ['Piña', 'Pomelo', 'Especias', 'Maderas'],
      ocasion: ['noche', 'formal'],
      ocasionLabels: ['Noche', 'Formal'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'La versión que no pide permiso.',
      image: '../assets/images/inspirations/absolu-authority.png',
      characterColor: 'oklch(24% 0.05 50)',
      inspiration: { name: 'Aventus Absolu', brand: 'Creed', image: null },
      featured: false
    },
    {
      id: 'apple-whisper',
      name: 'Apple Whisper',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['brandy-manzana', 'canela', 'madera-haya', 'almizcle'],
      noteLabels: ['Brandy de manzana', 'Canela', 'Madera de haya', 'Almizcle'],
      ocasion: ['diario', 'fin-de-semana'],
      ocasionLabels: ['Diario', 'Fin de semana'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'Una mañana de domingo que no quisiste que terminara.',
      image: '../assets/images/inspirations/apple-whisper.png',
      characterColor: 'oklch(80% 0.04 65)',
      inspiration: { name: 'Apple Brandy on the Rocks', brand: 'By Kilian', image: null },
      featured: false
    },
    {
      id: 'dark-sinner',
      name: 'Dark Sinner',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['ron', 'cafe', 'chocolate-negro', 'caramelo'],
      noteLabels: ['Ron', 'Café', 'Chocolate negro', 'Caramelo'],
      ocasion: ['noche', 'fin-de-semana'],
      ocasionLabels: ['Noche', 'Fin de semana'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'Dulce como una confesión que nunca harás.',
      image: '../assets/images/inspirations/dark-sinner.png',
      characterColor: 'oklch(22% 0.03 15)',
      inspiration: { name: 'Black Phantom', brand: 'By Kilian', image: null },
      featured: false
    },
    {
      id: 'dream-trap',
      name: 'Dream Trap',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['cognac', 'canela', 'vainilla', 'haba-tonka'],
      noteLabels: ['Coñac', 'Canela', 'Vainilla', 'Haba tonka'],
      ocasion: ['noche', 'formal'],
      ocasionLabels: ['Noche', 'Formal'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'El atardecer cuando el tiempo se suspende entre copa y copa.',
      image: '../assets/images/inspirations/dream-trap.png',
      characterColor: 'oklch(50% 0.07 50)',
      inspiration: { name: "Angels' Share", brand: 'By Kilian', image: null },
      featured: false
    },
    {
      id: 'exotic-contraste',
      name: 'Exotic Contraste',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['naranja', 'limon', 'frutas-tropicales', 'almizcle-blanco'],
      noteLabels: ['Naranja siciliana', 'Limón', 'Frutas tropicales', 'Almizcle blanco'],
      ocasion: ['diario', 'verano'],
      ocasionLabels: ['Diario', 'Verano'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'Fruta tropical chocando contra una tarde de seda.',
      image: '../assets/images/inspirations/exotic-contraste.png',
      characterColor: 'oklch(72% 0.13 55)',
      inspiration: { name: 'Erba Pura', brand: 'Xerjoff', image: null },
      featured: false
    },
    {
      id: 'fireside-memory',
      name: 'Fireside Memory',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['castana', 'vainilla', 'humo', 'madera'],
      noteLabels: ['Castaña', 'Vainilla', 'Humo', 'Madera'],
      ocasion: ['noche', 'invierno'],
      ocasionLabels: ['Noche', 'Invierno'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'El olor del fuego antes de que alguien lo apague.',
      image: '../assets/images/inspirations/fireside-memory.png',
      characterColor: 'oklch(32% 0.05 30)',
      inspiration: { name: 'By the Fireplace', brand: 'Maison Margiela', image: null },
      featured: false
    },
    {
      id: 'fresh-coast',
      name: 'Fresh Coast',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['citricos', 'notas-marinas', 'jazmin', 'cedro'],
      noteLabels: ['Cítricos', 'Notas marinas', 'Jazmín', 'Cedro'],
      ocasion: ['diario', 'verano'],
      ocasionLabels: ['Diario', 'Verano'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'El mar desde lejos, limpio como el principio de algo.',
      image: '../assets/images/inspirations/fresh-coast.png',
      characterColor: 'oklch(65% 0.08 215)',
      inspiration: { name: 'Acqua di Giò', brand: 'Armani', image: null },
      featured: false
    },
    {
      id: 'fresh-signature',
      name: 'Fresh Signature',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['pomelo', 'jengibre', 'incienso', 'sandalo'],
      noteLabels: ['Pomelo', 'Jengibre', 'Incienso', 'Sándalo'],
      ocasion: ['diario', 'formal'],
      ocasionLabels: ['Diario', 'Formal'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'La misma habitación, pero alguien ha entrado.',
      image: '../assets/images/inspirations/fresh-signature.png',
      characterColor: 'oklch(52% 0.05 240)',
      inspiration: { name: 'Bleu de Chanel', brand: 'Chanel', image: null },
      featured: false
    },
    {
      id: 'green-profile',
      name: 'Green Profile',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['hierba-verde', 'iris', 'sandalo', 'violeta'],
      noteLabels: ['Hierba verde', 'Iris', 'Sándalo', 'Violeta'],
      ocasion: ['formal', 'diario'],
      ocasionLabels: ['Formal', 'Diario'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'La campiña en el traje de alguien que no lo parece.',
      image: '../assets/images/inspirations/green-profile.png',
      characterColor: 'oklch(50% 0.10 145)',
      inspiration: { name: 'Green Irish Tweed', brand: 'Creed', image: null },
      featured: false
    },
    {
      id: 'jagger-index',
      name: 'Jagger Index',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['ron', 'tabaco', 'vainilla', 'cuero'],
      noteLabels: ['Ron', 'Tabaco', 'Vainilla', 'Cuero'],
      ocasion: ['noche', 'fin-de-semana'],
      ocasionLabels: ['Noche', 'Fin de semana'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'El escenario vacío que todavía huele a actuación.',
      image: '../assets/images/inspirations/jagger-index.png',
      characterColor: 'oklch(28% 0.04 25)',
      inspiration: { name: 'Jazz Club', brand: 'Maison Margiela', image: null },
      featured: false
    },
    {
      id: 'last-light',
      name: 'Last Light',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['vainilla', 'benjui', 'ambar', 'haba-tonka'],
      noteLabels: ['Vainilla', 'Benjuí', 'Ámbar', 'Haba tonka'],
      ocasion: ['noche', 'formal'],
      ocasionLabels: ['Noche', 'Formal'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'La última hora de luz antes de que el día decida terminar.',
      image: '../assets/images/inspirations/last-light.png',
      characterColor: 'oklch(58% 0.09 62)',
      inspiration: { name: 'Grand Soir', brand: 'Maison Francis Kurkdjian', image: null },
      featured: false
    },
    {
      id: 'luminous-dream',
      name: 'Luminous Dream',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['lichi', 'rosa', 'cacao', 'pachuli'],
      noteLabels: ['Lichi', 'Rosa', 'Cacao', 'Pachulí'],
      ocasion: ['diario', 'fin-de-semana'],
      ocasionLabels: ['Diario', 'Fin de semana'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'Una flor que aparece en el sueño y huele igual al despertar.',
      image: '../assets/images/inspirations/luminous-dream.png',
      characterColor: 'oklch(72% 0.08 330)',
      inspiration: { name: 'Attrape-Rêves', brand: 'Louis Vuitton', image: null },
      featured: false
    },
    {
      id: 'neutral-state',
      name: 'Neutral State',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['ambreta', 'violeta', 'sandalo', 'almizcle'],
      noteLabels: ['Ambreta', 'Violeta', 'Sándalo', 'Almizcle'],
      ocasion: ['diario', 'formal'],
      ocasionLabels: ['Diario', 'Formal'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'Lo que queda en el aire después de que alguien notable se ha ido.',
      image: '../assets/images/inspirations/neutral-state.png',
      characterColor: 'oklch(80% 0.004 80)',
      inspiration: { name: 'Mojave Ghost', brand: 'Byredo', image: null },
      featured: false
    },
    {
      id: 'nomad-ritual',
      name: 'Nomad Ritual',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['oud', 'rosa', 'incienso', 'frambuesa'],
      noteLabels: ['Oud', 'Rosa', 'Incienso', 'Frambuesa'],
      ocasion: ['noche', 'formal'],
      ocasionLabels: ['Noche', 'Formal'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'El ritual del viajero que lleva su tierra consigo.',
      image: '../assets/images/inspirations/nomad-ritual.png',
      characterColor: 'oklch(26% 0.05 35)',
      inspiration: { name: 'Ombre Nomade', brand: 'Louis Vuitton', image: null },
      featured: false
    },
    {
      id: 'prime-authority',
      name: 'Prime Authority',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['pina', 'bergamota', 'abedul', 'almizcle'],
      noteLabels: ['Piña', 'Bergamota', 'Abedul ahumado', 'Almizcle'],
      ocasion: ['formal', 'diario'],
      ocasionLabels: ['Formal', 'Diario'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'La primera impresión que no necesita segunda.',
      image: '../assets/images/inspirations/prime-authority.png',
      characterColor: 'oklch(35% 0.06 48)',
      inspiration: { name: 'Aventus', brand: 'Creed', image: null },
      featured: false
    },
    {
      id: 'queen-essence',
      name: 'Queen Essence',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['osmanthus', 'vainilla', 'azafran', 'almizcle'],
      noteLabels: ['Osmanthus', 'Vainilla', 'Azafrán', 'Almizcle'],
      ocasion: ['noche', 'formal'],
      ocasionLabels: ['Noche', 'Formal'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'La seda que se siente antes de verse.',
      image: '../assets/images/inspirations/queen-essence.png',
      characterColor: 'oklch(65% 0.06 75)',
      inspiration: { name: 'Queen of Silk', brand: 'Creed', image: null },
      featured: false
    },
    {
      id: 'rose-desire',
      name: 'Rose Desire',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['lichi', 'rosa-turca', 'peonia', 'vainilla'],
      noteLabels: ['Lichi', 'Rosa turca', 'Peonía', 'Vainilla'],
      ocasion: ['noche', 'fin-de-semana'],
      ocasionLabels: ['Noche', 'Fin de semana'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'La rosa que convierte la habitación en su propio perfume.',
      image: '../assets/images/inspirations/rose-desire.png',
      characterColor: 'oklch(68% 0.10 355)',
      inspiration: { name: 'Delina', brand: 'Parfums de Marly', image: null },
      featured: false
    },
    {
      id: 'santal-embrace',
      name: 'Santal Embrace',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['rosa', 'sandalo', 'especias', 'almizcle'],
      noteLabels: ['Rosa', 'Sándalo', 'Especias suaves', 'Almizcle'],
      ocasion: ['diario', 'formal'],
      ocasionLabels: ['Diario', 'Formal'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'El calor de algo que no tiene prisa en irse.',
      image: '../assets/images/inspirations/santal-embrace.png',
      characterColor: 'oklch(62% 0.06 58)',
      inspiration: { name: 'Santal Pao Rosa', brand: 'Guerlain', image: null },
      featured: false
    },
    {
      id: 'shadow-leather',
      name: 'Shadow Leather',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['cuero', 'almendra', 'vainilla', 'haba-tonka'],
      noteLabels: ['Cuero', 'Almendra amarga', 'Vainilla', 'Haba tonka'],
      ocasion: ['noche', 'formal'],
      ocasionLabels: ['Noche', 'Formal'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'El cuero que no pide disculpas.',
      image: '../assets/images/inspirations/shadow-leather.png',
      characterColor: 'oklch(28% 0.04 30)',
      inspiration: { name: 'Fucking Fabulous', brand: 'Tom Ford', image: null },
      featured: false
    },
    {
      id: 'silver-veil',
      name: 'Silver Veil',
      category: 'icon-series',
      categoryLabel: 'ICON SERIES',
      notes: ['te-verde', 'grosella-negra', 'almizcle', 'cedro'],
      noteLabels: ['Té verde', 'Grosella negra', 'Almizcle', 'Cedro'],
      ocasion: ['diario', 'verano'],
      ocasionLabels: ['Diario', 'Verano'],
      formats: [
        { value: 'Pack 3 Decants 10ml', label: '3 DECANTS · 10ML', key: 'decant', price: 12000 },
        { value: 'Frasco 30ml',          label: 'FRASCO · 30ML',   key: '30ml',   price: 12000 },
        { value: 'Frasco 100ml',         label: 'FRASCO · 100ML',  key: '100ml',  price: 20000 }
      ],
      narrative: 'El alba cuando el aire todavía no sabe qué temperatura tiene.',
      image: '../assets/images/inspirations/silver-veil.png',
      characterColor: 'oklch(75% 0.02 218)',
      inspiration: { name: 'Silver Mountain Water', brand: 'Creed', image: null },
      featured: false
    },
  ];
})(window);
