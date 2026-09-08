# Part 4 — ZEC Payment POC (Phases 25–37)

## Scope

This is deliberately a **testnet-only payment proof-of-concept**.

It proves:

1. a dedicated project-controlled test recipient can be configured;
2. recipient/amount are backend-controlled rather than hardcoded in React;
3. Noir can be asked to send a tiny ZEC amount with shielded funding;
4. the user reviews/approves inside Noir;
5. the app receives the returned txid, never the signing key;
6. txid survives refresh;
7. a trusted Zcash RPC independently checks transaction existence and confirmations;
8. RPC outage does not cause the UI to request another payment.

It does **not** prove ZSA minting or payment+issuance atomicity.

## Phase 25 — Dedicated test recipient

Create this wallet manually in the official Noir **testnet** extension.

Use:

```bash
npm run setup:test-recipient
```

The helper asks only for the wallet's public receive address and writes it to gitignored `backend/.env`.

Never enter:

- recovery phrase;
- private key;
- spending key;
- wallet password.

Keep this wallet isolated from any production treasury.

## Phase 26 — Backend-controlled recipient

Frontend never contains the payment address.

The frontend calls:

```text
GET /api/poc/payment-config
```

and receives:

- network;
- recipient;
- decimal ZEC amount;
- funding source;
- confirmation requirement.

## Phase 27 — Diagnostic page

The page displays:

- network;
- shortened recipient;
- amount;
- funding source;
- confirmation policy;
- Send test ZEC;
- txid;
- independent verification state.

## Phase 28 — Noir transaction API

Current documented API:

```ts
const txid = await wallet.zcash.sendTransaction({
  to: recipient,
  amount: '0.001',
  fundingSource: 'shielded',
});
```

Amounts are decimal ZEC strings.

## Phase 29 — Approval review

Noir owns the approval UI.

Before approving, manually confirm:

- destination address;
- amount;
- intended test network;
- shielded funding source;
- wallet fee.

The app must not claim that it verified the extension UI programmatically.

## Phase 30 — Private-key boundary

Browser sends only public transaction intent to Noir:

- `to`;
- `amount`;
- `fundingSource`.

Noir handles approval/signing/broadcast.

Frontend receives:

- txid or error.

Backend receives:

- public txid for independent verification.

No user seed/private key/spending key enters this project.

## Phase 31 — txid persistence

After `sendTransaction()` resolves, txid is immediately written to browser local storage:

```text
zec-mint:poc-payment
```

A refresh therefore resumes verification instead of creating a fresh send.

## Phase 32 — Status model

Implemented UI states:

- `REQUESTING`
- `APPROVAL`
- `SUBMITTED`
- `CONFIRMING`
- `CONFIRMED`
- `FAILED`
- `USER_REJECTED`

Additional safety states:

- `READY`
- `LOADING_CONFIG`
- `INSUFFICIENT_FUNDS`
- `NETWORK_ERROR`

## Phase 33 — Independent verification

Backend uses a separately configured trusted Zcash JSON-RPC endpoint:

```text
getrawtransaction <txid> 1
```

The POC checks:

- whether the tx can be independently found;
- confirmation count;
- block hash when available.

### Important shielded-payment limitation

This Part 4 endpoint proves **existence and confirmation** of the txid.

It does **not yet prove the shielded recipient and amount from public chain data**, because shielded Zcash hides those details. Production payment verification will need a recipient-controlled viewing/wallet mechanism or another verified design that can prove the incoming shielded payment without exposing user secrets.

Do not mistake public txid existence for complete merchant payment verification.

## Phase 34 — Confirmation policy

Default POC policy:

```text
POC_REQUIRED_CONFIRMATIONS=1
```

This is intentionally configurable.

For this POC:

- 0 confirmations -> `CONFIRMING`
- > = configured threshold -> `CONFIRMED`
- temporarily not found -> still `CONFIRMING`
- RPC unavailable -> `NETWORK_ERROR`

A production policy must be decided separately based on operational risk and the final verification mechanism.

## Phase 35 — Insufficient funds

Noir remains authoritative for whether a transaction can actually be constructed.

The UI maps unambiguous provider messages containing insufficient/not-enough/funds language to `INSUFFICIENT_FUNDS`.

Do not infer spendability solely from displayed total balance; Noir documents `available` as the relevant spendable value.

## Phase 36 — Wallet rejection

If the user rejects approval:

- no txid is stored;
- state becomes `USER_REJECTED`;
- the user may return to READY and retry;
- the app must not display `SUBMITTED`.

## Phase 37 — Network/RPC failure

If independent verification fails:

- any existing txid remains persisted;
- Send test ZEC stays disabled;
- state becomes `NETWORK_ERROR`;
- UI says **do not send another payment**;
- user can retry verification.

This is the POC's protection against duplicate payment during verifier outages.

## Setup

Copy templates:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Create/configure the dedicated test recipient:

```bash
npm run setup:test-recipient
```

Then fill in the trusted testnet RPC values in `backend/.env`.

Install and run:

```bash
npm install
npm run check
npm run dev
```

## Manual exit criteria

Complete `docs/zec-payment-poc-test-results.md`.

Part 4 is experimentally complete only when:

- Noir testnet approval/broadcast works;
- a valid txid is returned;
- the independent verifier finds it;
- the configured confirmation threshold is reached;
- rejection produces no txid;
- insufficient funds produce a recoverable state;
- RPC outage never re-enables the send button while a txid is pending.
