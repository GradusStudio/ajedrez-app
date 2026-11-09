-- Una fila por llave (id = SHA-256 hex de la llave). Borrar deja la marca `deleted` para que otros dispositivos se enteren.
CREATE TABLE IF NOT EXISTS progress (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  data TEXT,
  deleted INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
