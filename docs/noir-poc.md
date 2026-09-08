# Part 3 — Noir POC (Phases 13–24)

## Objective

Prove the currently documented Noir browser integration before introducing ZEC payment or ZSA issuance.

## Official API used

The current Noir documentation exposes the SDK through:

```ts
import { getNoirWallet } from '@noir-wallet/sdk';
```

All wallet methods used by this POC are under `wallet.zcash`.

### Silent startup

The application:

1. calls `getNoirWallet()`;
2. if present, calls `wallet.zcash.getAccounts()` silently;
3. treats `null` as not connected;
4. does not open the wallet during page startup.

### Deliberate connect action

Only a user button invokes:

```ts
await wallet.zcash.connect();
```

The returned connection contains:

- primary `transparent` address;
- primary `shielded` address;
- `accounts[]` authorized for the site.

### Balance

The POC uses:

```ts
await wallet.zcash.getBalance(accountId);
```

and displays `available` as the important spendable-balance indicator.

### Account changes

The POC subscribes to:

```ts
wallet.zcash.on('accountsChanged', handler);
```

On the event it does not trust stale cached state. It re-runs `getAccounts()` and re-reads the selected account balance.

Cleanup uses:

```ts
wallet.zcash.removeListener('accountsChanged', handler);
```

### Disconnect

The POC uses:

```ts
await wallet.zcash.disconnect();
```

and clears all wallet-dependent React state.

## Address capabilities

Noir currently exposes both:

- a transparent address;
- a shielded address.

For this project:

### Shielded

Use as the preferred Zcash privacy-preserving address/funding model when the next operation supports it. Shielded transactions protect details that transparent transactions expose.

### Transparent

Compatibility fallback only. Transparent activity is public on-chain and may link UTXOs/addresses.

### Important ZSA limitation

This POC proves Noir's **ZEC wallet provider**. It does not prove that Noir displays, issues, transfers, or controls ZSAs through its public dApp SDK.

That remains the Phase-5/Part-5 hard technical gate.

## Error handling

The public documentation does not guarantee one universal numeric code for every rejection condition.

The POC therefore:

- recognizes an explicit EIP-1193-style `4001` rejection when present;
- recognizes clear user-rejected/cancelled wording;
- otherwise preserves the provider message;
- always returns to a disconnected state after connection rejection.

This prevents a rejected connection from appearing connected.

## Phase completion mapping

### Phase 13

React + Vite + TypeScript diagnostic frontend exists.

### Phase 14

`@noir-wallet/sdk` is declared as the supported SDK dependency. Run `npm install` locally to resolve and lock the current published package, then run the build gate.

### Phase 15

`getNoirWallet()` detection is surfaced as `NOT_INSTALLED`, `DISCONNECTED`, or connected states.

### Phase 16

Missing wallet renders official installation guidance and does not fake a connection.

### Phase 17

Connect button invokes `wallet.zcash.connect()` only after deliberate user action.

### Phase 18

Rejected connections map to `USER_REJECTED` and return to `DISCONNECTED`.

### Phase 19

Authorized account data is read from `connect()` / `getAccounts()` only.

### Phase 20

Addresses are shortened by default. Full values are only present as browser title text for diagnostics; no secrets exist here.

### Phase 21

Shielded and transparent capabilities are documented and visibly distinguished.

### Phase 22

Selected-account balance is read through `getBalance(accountId)`.

### Phase 23

`accountsChanged` triggers a full authorized-account/balance refresh.

### Phase 24

`disconnect()` revokes/clears the site's connected state in the UI.

## Definition of done on the developer machine

Run:

```bash
npm install
npm run check
npm run dev:frontend
```

Then test with the official **Noir testnet** extension:

1. No extension -> NOT_INSTALLED.
2. Install extension -> DISCONNECTED.
3. Click Connect -> Noir approval opens.
4. Reject -> USER_REJECTED, still disconnected.
5. Connect again and approve -> addresses/accounts appear.
6. Confirm available balance displays.
7. Change the authorized account/account set -> UI refreshes after `accountsChanged`.
8. Click Disconnect -> account/address/balance data disappears.
9. Reload -> `getAccounts()` silently restores only if the origin is still authorized.

Record results in `docs/noir-poc-test-results.md`.
