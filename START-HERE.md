# CHOMP testnet development build

This package is NOT a completed NFT mint or a mainnet release. It adds a database-backed inventory preview to your Noir proof of concept. Real mint routes fail closed. No environment value can activate native ZSA issuance in this version.

## Install

1. Install Node.js 22 LTS (matching `.nvmrc`) and npm. No Python, Rust, Docker or WSL is required for this web application.
2. Install PostgreSQL locally with a SQL client, OR provision a PostgreSQL database from your chosen provider. Use a dedicated development database. Do not disable certificate verification for a hosted database.
3. Keep the official Noir testnet extension for wallet tests. The separate ZSA tooling is still unresolved; ordinary Zcash testnet and ZSA experimental networks are different.

## Run on Windows

Extract to a NEW folder. In the folder containing the root package.json:

```powershell
npm ci
npm run setup
```

Setup creates missing environment files without overwriting existing files. The delivered archive excludes your original secrets and wallet files.

Create a database using your PostgreSQL administrator/client. For example in psql (choose your own password):

```sql
CREATE ROLE chomp_dev LOGIN PASSWORD 'REPLACE_WITH_YOUR_PASSWORD';
CREATE DATABASE chomp_dev OWNER chomp_dev;
```

Set `DATABASE_URL` in backend/.env:

```dotenv
DATABASE_URL=postgresql://chomp_dev:URL_ENCODED_PASSWORD@localhost:5432/chomp_dev
```

For hosted PostgreSQL use the provider's connection string and TLS instructions. Never put this URL in frontend/.env.

```powershell
npm run db:migrate
npm run db:seed
npm run dev
```

Open the Vite URL printed in the terminal. Backend defaults to 3001. Frontend VITE_API_BASE_URL must match. Seed creates 20 placeholder test asset records priced at 0.001 test ZEC, maximum quantity 5; it does not mint assets or upload artwork. It does not overwrite an existing collection. The database is authoritative for this collection; old MINT_* variables are legacy placeholders.

Connect Noir, then use **Test inventory reservation (no payment)** to exercise database reservations. Reservations are idempotent using a browser-generated UUID and recovery token, whose hash is stored server-side. Treat the local recovery token as private. Refresh restores the saved order. Unpaid preview reservations expire and are released on the next reservation request. There is no automatic background expiry worker yet. The preview does not prove wallet ownership and is development-only.

## Environment checklist

Required for inventory: DATABASE_URL. Keep NODE_ENV=development and ENABLE_RESERVATION_PREVIEW=true locally. Mainnet is rejected by this build. Empty payment recipient is allowed so database/UI development can run.

Optional standalone payment diagnostic: set ENABLE_PAYMENT_POC=true in backend/.env AND VITE_ENABLE_PAYMENT_POC=true in frontend/.env; fill a real testnet MINT_PAYMENT_ADDRESS and restart both services. This deliberately opt-in diagnostic can send a real testnet transfer. Fund a separate buyer first. RPC lookup is not shielded receipt proof and no diagnostic result marks an order paid. Store any returned txid and do not resend after an ambiguous result.

ZSA_NETWORK, ZSA_RPC_URL and ZSA_CLI_PATH are NOT connected to an issuance implementation. Do not purchase services expecting these placeholders to activate it.

## Before any public mint

Prove recipient-controlled ZSA receipt using compatible tooling and establish Noir support or agree a product change. Implement recipient-side shielded receipt scanning, network/amount/order verification, tx reuse prevention, issuance identity and confirmation, persistent retries and compensation. Then complete concurrency/security tests, real testnet E2E with two wallets, deployment and launch review. Keep the public mint paused until then.

See docs/DELIVERY-STATUS.md for roadmap accounting. Existing older completion documents are historical reports, not proof that their gates passed.
