CREATE TABLE IF NOT EXISTS zsa_assets (
  id text PRIMARY KEY,
  asset_identifier text NOT NULL UNIQUE,
  issuance_txid text CHECK(issuance_txid IS NULL OR issuance_txid ~ '^[0-9a-f]{64}$'),
  provider text NOT NULL DEFAULT 'disabled' CHECK(provider IN ('disabled','tx-tool','zkool-graphql')),
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','CONFIRMED','FAILED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS zsa_transfers (
  id text PRIMARY KEY,
  asset_identifier text NOT NULL REFERENCES zsa_assets(asset_identifier),
  transfer_txid text CHECK(transfer_txid IS NULL OR transfer_txid ~ '^[0-9a-f]{64}$'),
  provider text NOT NULL DEFAULT 'disabled' CHECK(provider IN ('disabled','tx-tool','zkool-graphql')),
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','CONFIRMED','FAILED')),
  recipient_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS zsa_asset_lookup ON zsa_assets(asset_identifier);
CREATE INDEX IF NOT EXISTS zsa_transfer_lookup ON zsa_transfers(asset_identifier, id);
