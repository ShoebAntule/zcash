# Environment Architecture

## Frontend

Only public configuration. Never expose issuer keys, seed phrases, user private keys, DB credentials, or private RPC credentials.

## Backend

Server-only configuration may include DB URL, trusted RPC credentials, payment configuration, and later issuer credentials after the ZSA POC proves the exact format.

## Defaults

- ZCASH_NETWORK=testnet
- ZSA_NETWORK=zsa-test
- MINT_STATUS=PAUSED

The project must never silently fall back to mainnet.
