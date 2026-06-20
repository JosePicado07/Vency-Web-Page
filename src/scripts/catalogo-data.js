/**
 * Vency Atelier — Full fragrance catalog
 * Source: Catálogo Vency Atelier (Excel) + notes.txt
 * cat values: "disenador" | "nicho" | "ultra-nicho"
 * gender values: "hombre" | "mujer" | "unisex"
 */
(function (root) {
  root.VENCY_FULL_CATALOG = [

    /* ── DISEÑADOR · HOMBRE ─────────────────────────────────── */
    { brand: 'ARMANI',             name: 'Acqua di Giò',              cat: 'disenador', gender: 'hombre', notes: 'Cítricos, notas marinas, jazmín, cedro. Fresco, acuático y limpio.',          vencyInterpretation: { id: 'fresh-coast',         name: 'Fresh Coast'         } },
    { brand: 'ARMANI',             name: 'Acqua di Giò Profondo',     cat: 'disenador', gender: 'hombre', notes: 'Bergamota, notas marinas, romero, pachulí. Acuático profundo y moderno.' },
    { brand: 'ARMANI',             name: 'Kogane',                    cat: 'disenador', gender: 'hombre', notes: 'Azafrán, cuero, oud, ámbar. Oriental lujoso y cálido.' },

    { brand: '',             name: 'Vert Malachite',            cat: 'disenador', gender: 'hombre', notes: 'Lirio, jazmín sambac, vainilla, benjuí. Floral cremoso y elegante.' },
    { brand: 'CHANEL',             name: 'Bleu de Chanel',            cat: 'disenador', gender: 'hombre', notes: 'Pomelo, jengibre, incienso, sándalo. Fresco-amaderado sofisticado.',         vencyInterpretation: { id: 'fresh-signature',     name: 'Fresh Signature'     } },
    { brand: 'CHANEL',             name: 'Bleu de Chanel Parfum',     cat: 'disenador', gender: 'hombre', notes: 'Limón, incienso, sándalo, cedro. Más profundo y refinado.' },
    { brand: 'CHANEL',             name: 'Allure Homme Sport',        cat: 'disenador', gender: 'hombre', notes: 'Mandarina, naranja, neroli, almizcle. Deportivo y energizante.' },

    { brand: 'CAROLINA HERRERA',   name: 'Bad Boy',                   cat: 'disenador', gender: 'hombre', notes: 'Pimienta negra, bergamota, cacao, haba tonka. Dulce especiado.' },
    { brand: 'CAROLINA HERRERA',   name: 'Bad Boy Cobalt',            cat: 'disenador', gender: 'hombre', notes: 'Ciruela, lavanda, geranio, vetiver. Aromático moderno.' },
    { brand: 'CAROLINA HERRERA',   name: '212 VIP Men',               cat: 'disenador', gender: 'hombre', notes: 'Maracuyá, vodka, jengibre, ámbar. Fiesta y noche.' },
    { brand: 'CAROLINA HERRERA',   name: 'Birds of Paradise Him',     cat: 'disenador', gender: 'hombre', notes: 'Piña, coco, notas tropicales, maderas. Tropical y veraniego.' },
    { brand: 'CAROLINA HERRERA',   name: '212 VIP Black',             cat: 'disenador', gender: 'hombre', notes: 'Absenta, lavanda, vainilla, almizcle. Dulce seductor.' },

    { brand: 'HUGO BOSS',          name: 'Boss Bottled',              cat: 'disenador', gender: 'hombre', notes: 'Manzana, canela, vainilla, sándalo. Dulce especiado clásico.' },
    { brand: 'HUGO BOSS',          name: 'Boss Bottled Elixir',       cat: 'disenador', gender: 'hombre', notes: 'Incienso, cardamomo, pachulí, cedro. Oscuro y elegante.' },
    { brand: 'HUGO BOSS',          name: 'The Boss',                  cat: 'disenador', gender: 'hombre', notes: 'Manzana, canela, madera. Masculino tradicional.' },
    { brand: 'HUGO BOSS',          name: 'The Scent',                 cat: 'disenador', gender: 'hombre', notes: 'Jengibre, maninka, cuero. Seductor y cálido.' },
    { brand: 'HUGO BOSS',          name: 'The Scent Elixir',          cat: 'disenador', gender: 'hombre', notes: 'Pimiento, lavanda, sándalo. Más intenso y sensual.' },

    { brand: 'DIOR',               name: 'Sauvage EDT',               cat: 'disenador', gender: 'hombre', notes: 'Bergamota, pimienta, ambroxan. Fresco especiado.' },
    { brand: 'DIOR',               name: 'Sauvage Elixir',            cat: 'disenador', gender: 'hombre', notes: 'Canela, nuez moscada, lavanda, regaliz. Potente y oscuro.' },
    { brand: 'DIOR',               name: 'Sauvage Eau Forte',         cat: 'disenador', gender: 'hombre', notes: 'Especias frescas, lavanda, almizcle. Limpio y moderno.' },
    { brand: 'DIOR',               name: 'Dior Homme Sport',          cat: 'disenador', gender: 'hombre', notes: 'Limón, elemi, incienso, maderas. Deportivo elegante.' },

    { brand: 'PACO RABANNE',       name: '1 Million Golden Oud',      cat: 'disenador', gender: 'hombre', notes: 'Oud, rosa, azafrán, cuero. Dulce oriental.' },
    { brand: 'PACO RABANNE',       name: 'Black XS',                  cat: 'disenador', gender: 'hombre', notes: 'Limón, praliné, pachulí. Juvenil y dulce.' },
    { brand: 'PACO RABANNE',       name: 'Pure XS',                   cat: 'disenador', gender: 'hombre', notes: 'Jengibre, vainilla, mirra, azúcar. Dulce y sexy.' },
    { brand: 'PACO RABANNE',       name: 'Invictus Parfum',           cat: 'disenador', gender: 'hombre', notes: 'Lavanda, jabón, maderas, haba tonka. Fresco dulce.' },
    { brand: 'PACO RABANNE',       name: 'Invictus Platinum',         cat: 'disenador', gender: 'hombre', notes: 'Absenta, menta, lavanda. Fresco metálico.' },
    { brand: 'PACO RABANNE',       name: 'Phantom Intense',           cat: 'disenador', gender: 'hombre', notes: 'Lavanda, vainilla, ron. Dulce moderno.' },
    { brand: 'PACO RABANNE',       name: 'Invictus Victory Elixir',   cat: 'disenador', gender: 'hombre', notes: 'Vainilla, incienso, haba tonka. Dulce potente.' },

    { brand: 'VIKTOR & ROLF',      name: 'Spicebomb Extreme',         cat: 'disenador', gender: 'hombre', notes: 'Tabaco, vainilla, canela, pimienta. Especiado cálido.' },

    { brand: 'PRADA',              name: 'Luna Rossa Carbon',         cat: 'disenador', gender: 'hombre', notes: 'Bergamota, pimienta, lavanda, ambroxan. Similar a Sauvage pero más limpio.' },
    { brand: 'PRADA',              name: 'Luna Rossa Ocean',          cat: 'disenador', gender: 'hombre', notes: 'Bergamota, iris, vetiver. Azul elegante.' },

    { brand: 'GUCCI',              name: 'Gucci Pour Homme II',       cat: 'disenador', gender: 'hombre', notes: 'Té negro, violeta, canela, tabaco. Refinado y suave.' },
    { brand: 'GUCCI',              name: 'Gucci Oud',                 cat: 'disenador', gender: 'hombre', notes: 'Frambuesa, rosa, oud, azafrán. Oud dulce.' },

    { brand: 'MONTBLANC',          name: 'Starwalker',                cat: 'disenador', gender: 'hombre', notes: 'Bambú, bergamota, almizcle. Fresco limpio.' },
    { brand: 'MONTBLANC',          name: 'Legend Spirit',             cat: 'disenador', gender: 'hombre', notes: 'Pomelo, lavanda, almizcle blanco. Fresco jabonoso.' },

    { brand: 'JEAN PAUL GAULTIER', name: 'Scandal Pour Homme',       cat: 'disenador', gender: 'hombre', notes: 'Caramelo, haba tonka, salvia. Dulce masculino.' },
    { brand: 'JEAN PAUL GAULTIER', name: 'Le Beau',                  cat: 'disenador', gender: 'hombre', notes: 'Coco, haba tonka, bergamota. Tropical sensual.' },
    { brand: 'JEAN PAUL GAULTIER', name: 'Le Male',                  cat: 'disenador', gender: 'hombre', notes: 'Lavanda, vainilla, menta. Barbershop dulce.' },
    { brand: 'JEAN PAUL GAULTIER', name: 'Le Male Parfum',           cat: 'disenador', gender: 'hombre', notes: 'Cardamomo, lavanda, vainilla. Más oscuro.' },
    { brand: 'JEAN PAUL GAULTIER', name: 'Le Male Lover',            cat: 'disenador', gender: 'hombre', notes: 'Vainilla, ámbar, maderas. Dulce cálido.' },
    { brand: 'JEAN PAUL GAULTIER', name: 'Le Male Elixir',           cat: 'disenador', gender: 'hombre', notes: 'Miel, vainilla, tabaco. Muy dulce.' },
    { brand: 'JEAN PAUL GAULTIER', name: 'Ultra Male',               cat: 'disenador', gender: 'hombre', notes: 'Pera, canela, vainilla. Dulce de fiesta.' },
    { brand: 'JEAN PAUL GAULTIER', name: 'Paradise Garden',          cat: 'disenador', gender: 'hombre', notes: 'Coco, higo, notas verdes. Tropical fresco.' },
    { brand: 'JEAN PAUL GAULTIER', name: 'No Limit$',                cat: 'disenador', gender: 'hombre', notes: 'Chocolate negro, especias, vainilla. Gourmand intenso.' },

    { brand: 'VALENTINO',          name: 'Valentino Uomo',            cat: 'disenador', gender: 'hombre', notes: 'Avellana, café, chocolate. Elegante gourmand.' },
    { brand: 'VALENTINO',          name: 'Born in Roma Uomo',         cat: 'disenador', gender: 'hombre', notes: 'Violeta, salvia, vetiver. Moderno y versátil.' },

    { brand: 'YVES SAINT LAURENT', name: 'Y',                        cat: 'disenador', gender: 'hombre', notes: 'Manzana, salvia, ambroxan. Fresco moderno.' },
    { brand: 'YVES SAINT LAURENT', name: 'MYSLF',                    cat: 'disenador', gender: 'hombre', notes: 'Bergamota, flor de azahar, maderas. Limpio contemporáneo.' },
    { brand: 'YVES SAINT LAURENT', name: 'Oud Noir',                 cat: 'disenador', gender: 'hombre', notes: 'Pimienta, cardamomo, oud. Oriental masculino.' },

    { brand: 'VERSACE',            name: 'Eros Parfum',               cat: 'disenador', gender: 'hombre', notes: 'Menta, vainilla, manzana. Dulce seductor.' },
    { brand: 'VERSACE',            name: 'Eros Energy',               cat: 'disenador', gender: 'hombre', notes: 'Cítricos, ámbar, almizcle. Energético y brillante.' },
    { brand: 'VERSACE',            name: 'Eros Flame',                cat: 'disenador', gender: 'hombre', notes: 'Mandarina, pimienta, vainilla. Dulce especiado.' },

    /* ── DISEÑADOR · MUJER ──────────────────────────────────── */
    { brand: 'CAROLINA HERRERA',   name: 'Very Good Girl',            cat: 'disenador', gender: 'mujer', notes: 'Lichi, grosella roja, rosa, vainilla. Dulce afrutado con rosa elegante.' },
    { brand: 'CAROLINA HERRERA',   name: 'Good Girl Blush',           cat: 'disenador', gender: 'mujer', notes: 'Bergamota, peonía, vainilla, haba tonka. Floral dulce y femenino.' },
    { brand: 'CAROLINA HERRERA',   name: 'Good Girl Suprême',         cat: 'disenador', gender: 'mujer', notes: 'Frutos rojos, jazmín egipcio, haba tonka, vetiver. Dulce sensual y nocturno.' },

    { brand: 'BURBERRY',           name: 'Goddess Intense',           cat: 'disenador', gender: 'mujer', notes: 'Vainilla, lavanda, cacao, pachulí. Vainillado profundo y envolvente.' },
    { brand: 'BURBERRY',           name: 'Women',                     cat: 'disenador', gender: 'mujer', notes: 'Durazno, pera, vainilla, sándalo. Frutal suave y clásico.' },
    { brand: 'BURBERRY',           name: 'Her',                       cat: 'disenador', gender: 'mujer', notes: 'Fresas, frutos rojos, vainilla, almizcle. Dulce juvenil y adictivo.' },
    { brand: 'BURBERRY',           name: 'Her Elixir',                cat: 'disenador', gender: 'mujer', notes: 'Fresa, mora, vainilla cremosa, ámbar. Más denso y cremoso que Her.' },

    { brand: 'AZZARO',             name: 'Wanted Girl',               cat: 'disenador', gender: 'mujer', notes: 'Flor de jengibre, dulce de leche, vetiver. Gourmand femenino y cálido.' },

    { brand: 'DIOR',               name: 'Miss Dior Blooming Bouquet',cat: 'disenador', gender: 'mujer', notes: 'Peonía, rosa damascena, almizcle blanco. Floral fresco y romántico.' },
    { brand: 'DIOR',               name: 'Miss Dior Eau de Parfum',   cat: 'disenador', gender: 'mujer', notes: 'Rosa centifolia, peonía, iris, vainilla. Floral elegante y refinado.' },
    { brand: 'DIOR',               name: 'Gris Dior',                 cat: 'disenador', gender: 'mujer', notes: 'Rosa, pachulí, musgo, maderas. Floral chipre sofisticado.' },

    { brand: 'DOLCE & GABBANA',    name: 'Pineapple',                 cat: 'disenador', gender: 'mujer', notes: 'Piña, frutas tropicales, almizcle. Tropical luminoso y alegre.' },
    { brand: 'DOLCE & GABBANA',    name: 'Devotion',                  cat: 'disenador', gender: 'mujer', notes: 'Limón confitado, flor de azahar, vainilla. Postre cítrico cremoso.' },

    { brand: 'GIVENCHY',           name: 'Very Irresistible',         cat: 'disenador', gender: 'mujer', notes: 'Rosa, anís estrellado, peonía. Floral fresco con toque especiado.' },
    { brand: 'GIVENCHY',           name: 'Irresistible',              cat: 'disenador', gender: 'mujer', notes: 'Pera, rosa, almizcle, cedro. Limpio, femenino y moderno.' },

    { brand: 'JEAN PAUL GAULTIER', name: 'Divine',                   cat: 'disenador', gender: 'mujer', notes: 'Lirio, merengue, notas marinas. Dulce floral con toque salado.' },
    { brand: 'JEAN PAUL GAULTIER', name: 'Divine Le Parfum',         cat: 'disenador', gender: 'mujer', notes: 'Lirio, jazmín, ámbar, benjuí. Más cálido y sensual.' },
    { brand: 'JEAN PAUL GAULTIER', name: 'Scandal',                  cat: 'disenador', gender: 'mujer', notes: 'Miel, gardenia, pachulí. Dulce intenso y seductor.' },

    { brand: 'LANCÔME',            name: 'La Vie Est Belle',          cat: 'disenador', gender: 'mujer', notes: 'Pera, iris, praliné, vainilla. Dulce elegante y muy femenina.' },
    { brand: 'LANCÔME',            name: 'O Oui!',                   cat: 'disenador', gender: 'mujer', notes: 'Cítricos, flores blancas, almizcle. Fresco y alegre.' },
    { brand: 'LANCÔME',            name: "La Vie Est Belle L'Élixir", cat: 'disenador', gender: 'mujer', notes: 'Frambuesa, rosa, cacao, vainilla. Más gourmand y moderno.' },

    { brand: 'KIM KARDASHIAN',     name: 'BFF',                      cat: 'disenador', gender: 'mujer', notes: 'Frutas dulces, flores suaves, vainilla. Juvenil y divertido.' },

    { brand: 'VERSACE',            name: 'Dylan Blue Femme',          cat: 'disenador', gender: 'mujer', notes: 'Manzana, grosella negra, rosa, almizcle. Frutal elegante.' },
    { brand: 'VERSACE',            name: 'Dylan Purple',              cat: 'disenador', gender: 'mujer', notes: 'Pera, naranja amarga, fresia, almizcle. Fresco afrutado brillante.' },
    { brand: 'VERSACE',            name: 'Bright Crystal',            cat: 'disenador', gender: 'mujer', notes: 'Yuzu, granada, peonía, almizcle. Fresco, limpio y femenino.' },
    { brand: 'VERSACE',            name: 'Eros Pour Femme',           cat: 'disenador', gender: 'mujer', notes: 'Limón siciliano, jazmín, granada, almizcle. Floral cítrico sensual.' },

    { brand: 'VALENTINO',          name: 'Donna Born in Roma',        cat: 'disenador', gender: 'mujer', notes: 'Grosella negra, jazmín, vainilla bourbon. Dulce moderno.' },
    { brand: 'VALENTINO',          name: 'Donna Yellow Dream',        cat: 'disenador', gender: 'mujer', notes: 'Limón, rosa, almizcle blanco. Luminoso y romántico.' },
    { brand: 'VALENTINO',          name: 'Donna Coral Fantasy',       cat: 'disenador', gender: 'mujer', notes: 'Kiwi, rosa, almizcle. Frutal fresco y alegre.' },

    { brand: 'ARIANA GRANDE',      name: 'Thank U Next',              cat: 'disenador', gender: 'mujer', notes: 'Frambuesa, pera, coco, macarons. Dulce juvenil.' },
    { brand: 'ARIANA GRANDE',      name: 'Cloud',                     cat: 'disenador', gender: 'mujer', notes: 'Lavanda, crema batida, coco, praliné. Dulce cremoso y etéreo.' },
    { brand: 'ARIANA GRANDE',      name: 'Cloud Pink',                cat: 'disenador', gender: 'mujer', notes: 'Frutas rojas, coco, vainilla, almizcle. Más afrutado que Cloud original.' },

    { brand: 'VIKTOR & ROLF',      name: 'Bonbon',                    cat: 'disenador', gender: 'mujer', notes: 'Caramelo, mandarina, flor de azahar, ámbar. Gourmand de caramelo.' },
    { brand: 'VIKTOR & ROLF',      name: 'Flowerbomb',                cat: 'disenador', gender: 'mujer', notes: 'Jazmín, rosa, orquídea, pachulí. Floral explosivo y elegante.' },

    { brand: 'YVES SAINT LAURENT', name: 'Libre',                     cat: 'disenador', gender: 'mujer', notes: 'Lavanda, flor de azahar, vainilla. Fresco, femenino y sofisticado.' },
    { brand: 'YVES SAINT LAURENT', name: 'Black Opium',               cat: 'disenador', gender: 'mujer', notes: 'Café, vainilla, flores blancas, pachulí. Dulce oscuro y seductor.' },

    { brand: 'CHANEL',             name: 'Chance Eau Fraîche',        cat: 'disenador', gender: 'mujer', notes: 'Limón, cedro, jazmín, almizcle. Fresco y chispeante.' },
    { brand: 'CHANEL',             name: 'Chance Eau Tendre',         cat: 'disenador', gender: 'mujer', notes: 'Toronja, membrillo, jazmín, almizcle blanco. Delicado y romántico.' },
    { brand: 'CHANEL',             name: 'Coco Mademoiselle',         cat: 'disenador', gender: 'mujer', notes: 'Naranja, rosa, pachulí, vainilla. Elegante y atemporal.' },

    { brand: 'PACO RABANNE',       name: 'Lady Million Royal',        cat: 'disenador', gender: 'mujer', notes: 'Frutas rojas, flores blancas, cachemira. Dulce glamuroso.' },
    { brand: 'PACO RABANNE',       name: 'Fame',                      cat: 'disenador', gender: 'mujer', notes: 'Mango, jazmín, incienso, vainilla. Tropical y moderno.' },
    { brand: 'PACO RABANNE',       name: 'Fame Blooming Pink',        cat: 'disenador', gender: 'mujer', notes: 'Mango, rosa, almizcle. Más floral y ligero.' },

    { brand: "VICTORIA'S SECRET",  name: 'Bombshell',                 cat: 'disenador', gender: 'mujer', notes: 'Maracuyá, peonía, vainilla ligera. Fresco afrutado muy femenino.' },
    { brand: "VICTORIA'S SECRET",  name: 'Eau So Sexy',               cat: 'disenador', gender: 'mujer', notes: 'Manzana, crema batida, flores suaves. Dulce coqueto.' },

    /* ── NICHO ──────────────────────────────────────────────── */
    { brand: 'PARFUMS DE MARLY',   name: 'Althaïr',                   cat: 'nicho', gender: 'unisex', notes: 'Vainilla bourbon, canela, flor de azahar, maderas. Vainilla lujosa, cremosa y especiada.' },
    { brand: 'PARFUMS DE MARLY',   name: 'Kalan',                     cat: 'nicho', gender: 'hombre', notes: 'Naranja sanguina, pimienta negra, lavanda, ámbar. Especiado fresco con fondo ambarado.' },
    { brand: 'PARFUMS DE MARLY',   name: 'Perseus',                   cat: 'nicho', gender: 'hombre', notes: 'Bergamota, toronja, vetiver, ámbar gris. Cítrico elegante y luminoso.' },
    { brand: 'PARFUMS DE MARLY',   name: 'Percival',                  cat: 'nicho', gender: 'hombre', notes: 'Mandarina, lavanda, geranio, almizcle. Limpio, fresco y muy versátil.' },
    { brand: 'PARFUMS DE MARLY',   name: 'Herod',                     cat: 'nicho', gender: 'hombre', notes: 'Tabaco, canela, vainilla, incienso. Tabaco dulce y refinado.' },
    { brand: 'PARFUMS DE MARLY',   name: 'Pegasus',                   cat: 'nicho', gender: 'hombre', notes: 'Almendra amarga, vainilla, heliotropo, sándalo. Cremoso y elegante.' },
    { brand: 'PARFUMS DE MARLY',   name: 'Layton',                    cat: 'nicho', gender: 'hombre', notes: 'Manzana, vainilla, cardamomo, maderas. Dulce especiado extremadamente versátil.' },
    { brand: 'PARFUMS DE MARLY',   name: 'Delina',                    cat: 'nicho', gender: 'mujer',  notes: 'Lichi, rosa turca, peonía, vainilla. Rosa afrutada femenina.',              vencyInterpretation: { id: 'rose-desire',          name: 'Rose Desire'         } },
    { brand: 'PARFUMS DE MARLY',   name: 'Valaya',                    cat: 'nicho', gender: 'mujer',  notes: 'Durazno blanco, flor de azahar, almizcle. Limpio, lujoso y sofisticado.' },

    { brand: 'CLIVE CHRISTIAN',    name: 'No. 1 Imperial Men',        cat: 'nicho', gender: 'hombre', notes: 'Lima, cardamomo, sándalo, ámbar. Opulento y clásico.' },
    { brand: 'CLIVE CHRISTIAN',    name: 'X For Men',                 cat: 'nicho', gender: 'hombre', notes: 'Ruibarbo, cardamomo, iris, cedro. Especiado elegante.' },

    { brand: 'ROJA',               name: 'Elysium',                   cat: 'nicho', gender: 'hombre', notes: 'Toronja, limón, vetiver, ámbar gris. Cítrico fresco de lujo.' },
    { brand: 'ROJA',               name: 'Fetish',                    cat: 'nicho', gender: 'unisex', notes: 'Cuero, incienso, vetiver, ámbar. Oscuro y sofisticado.' },

    { brand: 'BYREDO',             name: 'Tobacco Mandarin',          cat: 'nicho', gender: 'unisex', notes: 'Mandarina, tabaco, cuero, maderas. Tabaco cítrico moderno.' },
    { brand: 'BYREDO',             name: 'Mojave Ghost',              cat: 'nicho', gender: 'unisex', notes: 'Ambreta, violeta, sándalo, almizcle. Limpio, suave y etéreo.',               vencyInterpretation: { id: 'neutral-state',        name: 'Neutral State'       } },

    { brand: 'LOUIS VUITTON',      name: 'Ombre Nomade',              cat: 'nicho', gender: 'unisex', notes: 'Oud, rosa, incienso, frambuesa. Oud oscuro y poderoso.',                     vencyInterpretation: { id: 'nomad-ritual',         name: 'Nomad Ritual'        } },
    { brand: 'LOUIS VUITTON',      name: 'Les Sables Roses',          cat: 'nicho', gender: 'unisex', notes: 'Rosa, oud, ámbar gris. Rosa oriental lujosa.' },
    { brand: 'LOUIS VUITTON',      name: "L'Immensité",               cat: 'nicho', gender: 'hombre', notes: 'Jengibre, toronja, ámbar gris. Fresco especiado elegante.' },
    { brand: 'LOUIS VUITTON',      name: 'Pacific Chill',             cat: 'nicho', gender: 'unisex', notes: 'Limón, menta, frutas, almizcle. Refrescante y relajante.' },
    { brand: 'LOUIS VUITTON',      name: 'Imagination',               cat: 'nicho', gender: 'hombre', notes: 'Té negro, cítricos, jengibre, ambrox. Limpio, brillante y adictivo.' },
    { brand: 'LOUIS VUITTON',      name: 'Attrape-Rêves',             cat: 'nicho', gender: 'mujer',  notes: 'Lichi, rosa, cacao, pachulí. Floral afrutado sofisticado.',               vencyInterpretation: { id: 'luminous-dream',       name: 'Luminous Dream'      } },
    { brand: 'LOUIS VUITTON',      name: 'Symphony',                  cat: 'nicho', gender: 'unisex', notes: 'Cítricos brillantes, jengibre, almizcle. Lujo cítrico puro.' },

    { brand: 'BY KILIAN',          name: "Angels' Share",             cat: 'nicho', gender: 'unisex', notes: 'Coñac, canela, vainilla, tonka. Licor dulce espectacular.',                vencyInterpretation: { id: 'dream-trap',           name: 'Dream Trap'          } },
    { brand: 'BY KILIAN',          name: 'Black Phantom',             cat: 'nicho', gender: 'unisex', notes: 'Ron, café, chocolate negro, caramelo. Gourmand oscuro.',                    vencyInterpretation: { id: 'dark-sinner',          name: 'Dark Sinner'         } },
    { brand: 'BY KILIAN',          name: 'Smoking Hot',               cat: 'nicho', gender: 'unisex', notes: 'Tabaco, manzana, vainilla, canela. Dulce ahumado.' },
    { brand: 'BY KILIAN',          name: 'Good Girl Gone Bad',        cat: 'nicho', gender: 'mujer',  notes: 'Jazmín, osmanto, rosa, flores blancas. Floral sensual.' },
    { brand: 'BY KILIAN',          name: "Angels' Share Paradis",     cat: 'nicho', gender: 'unisex', notes: 'Coñac, frutas secas, vainilla, canela. Más intenso que Angels\' Share.' },

    { brand: 'ILMIN',              name: 'Il Femme',                  cat: 'nicho', gender: 'mujer',  notes: 'Flores blancas, vainilla, almizcle. Floral elegante.' },
    { brand: 'ILMIN',              name: 'Kakuno',                    cat: 'nicho', gender: 'unisex', notes: 'Frutas, especias suaves, maderas. Dulce especiado moderno.' },

    { brand: 'CREED',              name: 'Silver Mountain Water',     cat: 'nicho', gender: 'hombre', notes: 'Té verde, grosella negra, almizcle. Fresco metálico y limpio.',             vencyInterpretation: { id: 'silver-veil',          name: 'Silver Veil'         } },
    { brand: 'CREED',              name: 'Green Irish Tweed',         cat: 'nicho', gender: 'hombre', notes: 'Hierba verde, iris, sándalo. Caballero clásico.',                           vencyInterpretation: { id: 'green-profile',        name: 'Green Profile'       } },
    { brand: 'CREED',              name: 'Aventus',                   cat: 'nicho', gender: 'hombre', notes: 'Piña, bergamota, abedul, almizcle. Frutal ahumado legendario.',             vencyInterpretation: { id: 'prime-authority',      name: 'Prime Authority'     } },
    { brand: 'CREED',              name: 'Aventus Absolu',            cat: 'nicho', gender: 'hombre', notes: 'Piña, pomelo, especias, maderas. Aventus más oscuro.',                      vencyInterpretation: { id: 'absolu-authority',     name: 'Absolu Authority'    } },
    { brand: 'CREED',              name: 'Centaurus',                 cat: 'nicho', gender: 'hombre', notes: 'Tabaco, especias, maderas, resinas. Potente y cálido.' },
    { brand: 'CREED',              name: 'Aventus For Her',           cat: 'nicho', gender: 'mujer',  notes: 'Manzana verde, rosa, pachulí. Aventus femenino.' },
    { brand: 'CREED',              name: 'Royal Water',               cat: 'nicho', gender: 'unisex', notes: 'Cítricos, menta, albahaca, almizcle. Fresco aristocrático.' },
    { brand: 'CREED',              name: 'Carmina',                   cat: 'nicho', gender: 'unisex', notes: 'Cereza negra, rosa, azafrán, ámbar. Sensual y elegante.' },
    { brand: 'CREED',              name: 'Queen Of Silk',             cat: 'nicho', gender: 'mujer',  notes: 'Osmanthus, vainilla, azafrán, almizcle. Floral oriental sedoso.',          vencyInterpretation: { id: 'queen-essence',        name: 'Queen Essence'       } },

    { brand: 'MAISON MARGIELA',    name: 'Replica: Autumn Vibes',     cat: 'nicho', gender: 'unisex', notes: 'Hojas secas, cardamomo, cedro. Bosque otoñal.' },
    { brand: 'MAISON MARGIELA',    name: 'Replica: By the Fireplace', cat: 'nicho', gender: 'unisex', notes: 'Castaña, vainilla, humo, madera. Chimenea acogedora.',                       vencyInterpretation: { id: 'fireside-memory',      name: 'Fireside Memory'     } },
    { brand: 'MAISON MARGIELA',    name: 'Replica: Jazz Club',        cat: 'nicho', gender: 'unisex', notes: 'Ron, tabaco, vainilla. Bar elegante de jazz.',                               vencyInterpretation: { id: 'jagger-index',         name: 'Jagger Index'        } },

    { brand: 'NISHANE',            name: 'Hundred Silent Ways',       cat: 'nicho', gender: 'unisex', notes: 'Durazno, vainilla, flores blancas. Dulce elegante.' },
    { brand: 'NISHANE',            name: 'Shem',                      cat: 'nicho', gender: 'unisex', notes: 'Rosa, incienso, especias, ámbar. Oriental refinado.' },
    { brand: 'NISHANE',            name: 'Hacivat',                   cat: 'nicho', gender: 'unisex', notes: 'Piña, musgo de roble, vetiver. Aventus más verde y limpio.' },

    { brand: 'INITIO',             name: 'Oud for Greatness',         cat: 'nicho', gender: 'unisex', notes: 'Oud, azafrán, lavanda, almizcle. Oud moderno de lujo.' },
    { brand: 'INITIO',             name: 'Oud for Neo Greatness',     cat: 'nicho', gender: 'unisex', notes: 'Oud, especias, lavanda, maderas. Versión más fresca.' },
    { brand: 'INITIO',             name: 'Atomic Rose',               cat: 'nicho', gender: 'unisex', notes: 'Rosa, vainilla, ámbar. Rosa intensa y sensual.' },
    { brand: 'INITIO',             name: 'Musk Therapy',              cat: 'nicho', gender: 'unisex', notes: 'Almizcle blanco, bergamota, sándalo. Limpieza extrema.' },
    { brand: 'INITIO',             name: 'Side Effect',               cat: 'nicho', gender: 'unisex', notes: 'Ron, tabaco, canela, vainilla. Seducción embotellada.' },
    { brand: 'INITIO',             name: 'Rehab',                     cat: 'nicho', gender: 'unisex', notes: 'Lavanda, vetiver, sándalo, almizcle. Limpio y relajante.' },

    { brand: 'GUERLAIN',           name: 'Santal Pao Rosa',           cat: 'nicho', gender: 'unisex', notes: 'Rosa, sándalo, especias suaves. Cremoso y refinado.',                       vencyInterpretation: { id: 'santal-embrace',       name: 'Santal Embrace'      } },

    { brand: "PENHALIGON'S",       name: 'Lord George',               cat: 'nicho', gender: 'hombre', notes: 'Brandy, haba tonka, maderas. Caballero inglés elegante.' },

    { brand: 'STÉPHANE HUMBERT LUCAS', name: 'God of Fire',          cat: 'nicho', gender: 'hombre', notes: 'Mango, jengibre, limón, maderas. Mango tropical explosivo.' },
    { brand: 'STÉPHANE HUMBERT LUCAS', name: 'Soleil de Jeddah',     cat: 'nicho', gender: 'unisex', notes: 'Cítricos, iris, vainilla, ámbar. Luminoso y lujoso.' },

    { brand: 'MAISON CRIVELLI',    name: 'Oud Cadenza',               cat: 'nicho', gender: 'unisex', notes: 'Oud, especias, cuero. Intenso y oscuro.' },
    { brand: 'MAISON CRIVELLI',    name: 'Oud Maracujá',              cat: 'nicho', gender: 'unisex', notes: 'Maracuyá, oud, rosa, cuero. Frutal exótico y adictivo.' },

    { brand: 'MAISON FRANCIS KURKDJIAN', name: 'Baccarat Rouge 540', cat: 'nicho', gender: 'unisex', notes: 'Azafrán, jazmín, ámbar gris, cedro. Dulce mineral y etéreo.' },
    { brand: 'MAISON FRANCIS KURKDJIAN', name: 'Grand Soir',         cat: 'nicho', gender: 'unisex', notes: 'Vainilla, benjuí, ámbar, tonka. Ámbar cálido magistral.',                  vencyInterpretation: { id: 'last-light',           name: 'Last Light'          } },
    { brand: 'MAISON FRANCIS KURKDJIAN', name: 'Oud Silk Mood',      cat: 'nicho', gender: 'unisex', notes: 'Rosa búlgara, oud, papiro. Rosa-oud elegante.' },

    { brand: 'MANCERA',            name: 'Cedrat Boise',              cat: 'nicho', gender: 'unisex', notes: 'Limón, grosella negra, cuero, maderas. Aventus con limón.' },
    { brand: 'MANCERA',            name: 'Red Tobacco',               cat: 'nicho', gender: 'unisex', notes: 'Tabaco, canela, incienso, vainilla. Bestia dulce y especiada.' },
    { brand: 'MANCERA',            name: 'Instant Crush',             cat: 'nicho', gender: 'unisex', notes: 'Azafrán, vainilla, ámbar, jazmín. Primo de Baccarat más dulce.' },

    /* ── ULTRA NICHO ────────────────────────────────────────── */
    { brand: 'XERJOFF',            name: 'XJ 1861',                   cat: 'ultra-nicho', gender: 'hombre', notes: 'Cítricos, lavanda, maderas. Fresco italiano elegante.' },
    { brand: 'XERJOFF',            name: 'Erba Pura',                 cat: 'ultra-nicho', gender: 'unisex', notes: 'Naranja siciliana, limón, frutas exóticas, almizcle blanco. Frutal explosivo y muy proyectón.',  vencyInterpretation: { id: 'exotic-contraste',     name: 'Exotic Contraste'    } },
    { brand: 'XERJOFF',            name: 'Alexandria II',             cat: 'ultra-nicho', gender: 'unisex', notes: 'Palisandro, lavanda, oud, vainilla, ámbar. Majestuoso, rico y extremadamente lujoso.' },
    { brand: 'XERJOFF',            name: 'Italica (2021)',            cat: 'ultra-nicho', gender: 'unisex', notes: 'Almendra, leche, caramelo, vainilla. Postre italiano embotellado.' },
    { brand: 'XERJOFF',            name: 'Opera',                     cat: 'ultra-nicho', gender: 'unisex', notes: 'Rosa turca, frutas, vainilla, cuero. Dulce, elegante y opulento.' },
    { brand: 'XERJOFF',            name: 'Bouquet Ideale',            cat: 'ultra-nicho', gender: 'mujer',  notes: 'Canela, nuez moscada, vainilla, tabaco. Oriental cálido y refinado.' },
    { brand: 'XERJOFF',            name: 'Levar del Sole',            cat: 'ultra-nicho', gender: 'unisex', notes: 'Cítricos, flores blancas, almizcle. Luminoso y sofisticado.' },
    { brand: 'XERJOFF',            name: 'Naxos',                     cat: 'ultra-nicho', gender: 'hombre', notes: 'Miel, tabaco, lavanda, vainilla. Uno de los mejores tabacos dulces del mercado.' },

    { brand: 'TOM FORD',           name: 'Fucking Fabulous',          cat: 'ultra-nicho', gender: 'unisex', notes: 'Cuero, almendra amarga, vainilla, tonka. Cuero cremoso moderno.',            vencyInterpretation: { id: 'shadow-leather',       name: 'Shadow Leather'      } },
    { brand: 'TOM FORD',           name: 'Black Orchid',              cat: 'ultra-nicho', gender: 'unisex', notes: 'Trufa, chocolate, orquídea negra, pachulí. Oscuro, misterioso y sensual.' },
    { brand: 'TOM FORD',           name: 'Tobacco Vanille',           cat: 'ultra-nicho', gender: 'unisex', notes: 'Tabaco, vainilla, cacao, frutas secas. Tabaco dulce de referencia.' },
    { brand: 'TOM FORD',           name: 'Noir de Noir',              cat: 'ultra-nicho', gender: 'unisex', notes: 'Rosa, pachulí, trufa, vainilla. Rosa oscura y sensual.' },
    { brand: 'TOM FORD',           name: 'Soleil de Feu',             cat: 'ultra-nicho', gender: 'mujer',  notes: 'Nardos, ámbar, resinas, flores blancas. Floral cálido y solar.' },
    { brand: 'TOM FORD',           name: "Eau d'Ombré Leather",       cat: 'ultra-nicho', gender: 'unisex', notes: 'Cuero, cardamomo, vainilla suave. Cuero más fresco y accesible.' },
    { brand: 'TOM FORD',           name: 'Electric Cherry',           cat: 'ultra-nicho', gender: 'unisex', notes: 'Cereza, jazmín, almizcle. Frutal moderno y coqueto.' },

    { brand: 'AMOUAGE',            name: 'Interlude Black Iris',      cat: 'ultra-nicho', gender: 'hombre', notes: 'Incienso, iris, cuero, ámbar. Oscuro pero refinado.' },
    { brand: 'AMOUAGE',            name: 'Sunshine Woman',            cat: 'ultra-nicho', gender: 'mujer',  notes: 'Almendra, vainilla, tabaco blanco. Alegre y cremoso.' },
    { brand: 'AMOUAGE',            name: 'Royal Tobacco',             cat: 'ultra-nicho', gender: 'hombre', notes: 'Tabaco, incienso, especias, oud. Potencia extrema y lujo absoluto.' },

    { brand: 'TAUER PERFUMES',     name: 'Corazón del Desierto',      cat: 'ultra-nicho', gender: 'unisex', notes: 'Ámbar, incienso, especias, maderas secas. Desierto cálido y resinoso.' },

    { brand: 'KAJAL',              name: 'Dahab',                     cat: 'ultra-nicho', gender: 'unisex', notes: 'Manzana verde, maracuyá, almizcle, cedro. Frutal elegante.' },
    { brand: 'KAJAL',              name: 'Almaz',                     cat: 'ultra-nicho', gender: 'unisex', notes: 'Bergamota, frutas dulces, vainilla, ámbar. Dulce brillante.' },
    { brand: 'KAJAL',              name: 'Lamar',                     cat: 'ultra-nicho', gender: 'unisex', notes: 'Piña, rosa, vainilla, almizcle. Tropical de lujo.' },

    { brand: 'BOND NO. 9',         name: 'Bleecker Street',           cat: 'ultra-nicho', gender: 'unisex', notes: 'Arándano, hojas verdes, caramelo suave, pachulí. Verde dulce y único.' },
    { brand: 'BOND NO. 9',         name: 'Lafayette Street',          cat: 'ultra-nicho', gender: 'unisex', notes: 'Bergamota, manzana, vainilla, ámbar gris. Versátil y muy atractivo.' },
    { brand: 'BOND NO. 9',         name: 'Nolita',                    cat: 'ultra-nicho', gender: 'unisex', notes: 'Mandarina, rosa, almizcle. Floral afrutado limpio.' },
    { brand: 'BOND NO. 9',         name: 'Signature',                 cat: 'ultra-nicho', gender: 'unisex', notes: 'Oud, rosa, almizcle, ámbar. Oriental elegante.' },
    { brand: 'BOND NO. 9',         name: 'Scent of Peace',            cat: 'ultra-nicho', gender: 'unisex', notes: 'Piña, grosella negra, almizcle. Fresco afrutado muy agradable.' },

    { brand: 'ACQUA DI PARMA',     name: 'Bergamotto di Calabria',    cat: 'ultra-nicho', gender: 'unisex', notes: 'Bergamota, limón, cedro, almizcle. Cítrico italiano puro.' },

    { brand: 'FUGAZZI',            name: 'Sugardaddy',                cat: 'ultra-nicho', gender: 'unisex', notes: 'Cítricos, flores blancas, vainilla, almizcle. Dulce limpio y moderno.' },

    { brand: 'KAYALI',             name: 'Eden Sparkling Lychee',     cat: 'ultra-nicho', gender: 'mujer',  notes: 'Lichi, grosella negra, vainilla. Frutal femenino vibrante.' },
    { brand: 'KAYALI',             name: 'Lovefest Burning Cherry',   cat: 'ultra-nicho', gender: 'unisex', notes: 'Cereza, frambuesa, palo santo, vainilla. Cereza ahumada.' },
    { brand: 'KAYALI',             name: 'Pistachio Gelato',          cat: 'ultra-nicho', gender: 'unisex', notes: 'Pistacho, crema batida, vainilla, ron. Gourmand delicioso.' },
    { brand: 'KAYALI',             name: 'Eden Juicy Apple',          cat: 'ultra-nicho', gender: 'unisex', notes: 'Manzana roja, frutos rojos, vainilla. Dulce y juvenil.' },

    { brand: 'MATIÈRE PREMIÈRE',   name: 'Parisian Musc',             cat: 'ultra-nicho', gender: 'unisex', notes: 'Almizcle ambreta, cedro, semillas ambreta. Minimalista y elegante.' },
    { brand: 'MATIÈRE PREMIÈRE',   name: 'Vanilla Powder',            cat: 'ultra-nicho', gender: 'unisex', notes: 'Vainilla, coco, almizcle blanco. Vainilla seca y sofisticada.' },

    { brand: 'SPIRIT OF DUBAI',    name: 'Turath',                    cat: 'ultra-nicho', gender: 'unisex', notes: 'Azafrán, rosa, oud, ámbar, especias. Lujo árabe en estado puro.' },

    { brand: 'EX NIHILO',          name: 'Blue Talisman',             cat: 'ultra-nicho', gender: 'unisex', notes: 'Bergamota, pera, flor de azahar, almizcles. Fresco moderno de lujo.' },
    { brand: 'EX NIHILO',          name: 'Outcast Blue',              cat: 'ultra-nicho', gender: 'unisex', notes: 'Cítricos, especias suaves, maderas claras. Elegante y contemporáneo.' },
  ];
})(window);
