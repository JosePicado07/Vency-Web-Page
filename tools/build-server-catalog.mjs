#!/usr/bin/env node
/**
 * Genera functions/_lib/catalog-products.js — el mapa id → nivel de precio
 * que usa el servidor para cobrar. Lee los mismos archivos de datos que el
 * sitio (fragrance-data.js + catalogo-data.js) para que los IDs coincidan
 * con los que el carrito guarda.
 *
 * Correr después de agregar o quitar fragancias del catálogo:
 *   node tools/build-server-catalog.mjs
 *
 * Los PRECIOS no se copian de aquí: viven en functions/_lib/catalog.js y son
 * la única fuente que el servidor usa para cobrar.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TIERS = new Set(['vency', 'disenador', 'nicho', 'ultra-nicho']);

const sandbox = { window: {}, localStorage: null, document: null };
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
for (const f of ['src/scripts/fragrance-data.js', 'src/scripts/catalogo-data.js']) {
  // Los archivos son IIFEs que reciben `window` como root.
  vm.runInContext(readFileSync(join(root, f), 'utf8').replace(/^﻿/, ''), sandbox, { filename: f });
}
const w = sandbox.window;
const slugify = w.slugify;

const products = {};
function add(id, tier) {
  const t = TIERS.has(tier) ? tier : 'vency';
  if (products[id] && products[id] !== t) {
    throw new Error(`ID duplicado con distinto nivel de precio: ${id} (${products[id]} vs ${t})`);
  }
  products[id] = t;
}
(w.VENCY_CATALOG || []).forEach((f) => add(f.id, f.cat || 'vency'));
(w.VENCY_FULL_CATALOG || []).forEach((f) => add(slugify((f.brand || '') + '-' + f.name), f.cat));

const ids = Object.keys(products).sort();
const body = ids.map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(products[id])},`).join('\n');
const out = `/* ARCHIVO GENERADO por tools/build-server-catalog.mjs — no editar a mano.
 * id de producto → nivel de precio (ver PRICES en catalog.js). */
export const PRODUCT_TIERS = {
${body}
};
`;
writeFileSync(join(root, 'functions/_lib/catalog-products.js'), out);
console.log(`catalog-products.js: ${ids.length} productos`);
