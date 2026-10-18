/** D1 mínimo sobre node:sqlite para probar las funciones sin Cloudflare. */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

export function createD1() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../../migrations/0001_tilopay_orders.sql', import.meta.url), 'utf8'));
  return {
    raw: db,
    prepare(sql) {
      let args = [];
      const stmt = {
        bind(...a) { args = a; return stmt; },
        async run() {
          const r = db.prepare(sql).run(...args);
          return { meta: { changes: Number(r.changes) } };
        },
        async first() { return db.prepare(sql).get(...args) ?? null; },
      };
      return stmt;
    },
  };
}

export function createKV(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { async get(k) { return m.has(k) ? m.get(k) : null; }, async put(k, v) { m.set(k, v); } };
}
