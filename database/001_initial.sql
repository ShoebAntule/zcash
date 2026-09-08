CREATE TABLE IF NOT EXISTS collections (
 id text PRIMARY KEY,
 name text NOT NULL,
 max_supply integer NOT NULL CHECK(max_supply > 0),
 price_zatoshi bigint NOT NULL CHECK(price_zatoshi > 0),
 max_per_tx integer NOT NULL CHECK(max_per_tx > 0),
 status text NOT NULL DEFAULT 'PAUSED' CHECK(status IN ('PAUSED','ACTIVE'))
);
CREATE TABLE IF NOT EXISTS mint_orders (
 id uuid PRIMARY KEY,
 collection_id text NOT NULL REFERENCES collections(id),
 access_hash text NOT NULL,
 quantity integer NOT NULL CHECK(quantity > 0),
 total_zatoshi bigint NOT NULL CHECK(total_zatoshi > 0),
 status text NOT NULL CHECK(status IN ('RESERVED','EXPIRED','PAYMENT_SUBMITTED','PAYMENT_UNKNOWN','PAYMENT_CONFIRMED','ISSUANCE_PENDING','ISSUANCE_FAILED','MINTED','REFUND_REQUIRED','REFUNDED')),
 payment_txid text UNIQUE CHECK(payment_txid IS NULL OR payment_txid ~ '^[0-9a-f]{64}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS assets (
 id bigserial PRIMARY KEY,
 collection_id text NOT NULL REFERENCES collections(id),
 serial integer NOT NULL CHECK(serial > 0),
 name text NOT NULL,
 metadata_uri text,
 asset_identifier text UNIQUE,
 issuance_txid text,
 status text NOT NULL DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE','RESERVED','MINTED')),
 order_id uuid REFERENCES mint_orders(id),
 UNIQUE(collection_id, serial),
 CHECK((status = 'AVAILABLE' AND order_id IS NULL) OR (status <> 'AVAILABLE' AND order_id IS NOT NULL)),
 CHECK(status <> 'MINTED' OR (asset_identifier IS NOT NULL AND issuance_txid IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS order_events (
 id bigserial PRIMARY KEY,
 order_id uuid NOT NULL REFERENCES mint_orders(id),
 event text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS asset_inventory ON assets(collection_id,status,serial);
CREATE INDEX IF NOT EXISTS order_expiry ON mint_orders(status,expires_at);
CREATE INDEX IF NOT EXISTS order_event_lookup ON order_events(order_id,id);
