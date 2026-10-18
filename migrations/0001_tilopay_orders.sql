-- Órdenes de pago con Tilopay (Cloudflare D1).
-- Aplicar: npx wrangler d1 migrations apply vency-orders --remote

CREATE TABLE IF NOT EXISTS orders (
  id             TEXT PRIMARY KEY,               -- VA + 16 hex; se envía a Tilopay como número de orden
  status         TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'rejected', 'mismatch', 'init_failed')),
  amount         INTEGER NOT NULL,               -- colones enteros, calculado en el servidor
  currency       TEXT NOT NULL,                  -- 'CRC'
  subtotal       INTEGER NOT NULL,
  shipping       INTEGER NOT NULL,
  delivery       TEXT NOT NULL,                  -- 'domicilio' | 'local'
  items_json     TEXT NOT NULL,                  -- líneas con precio unitario del servidor
  customer_name  TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  tilopay_auth   TEXT,                           -- código de autorización (si la consulta lo devuelve)
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  paid_at        TEXT
);

-- Notificaciones ya procesadas (por hash SHA-256 del cuerpo crudo): una
-- notificación repetida se reconoce y no se vuelve a procesar.
CREATE TABLE IF NOT EXISTS webhook_events (
  body_sha256 TEXT PRIMARY KEY,
  order_id    TEXT,
  result      TEXT NOT NULL,
  received_at TEXT NOT NULL
);
