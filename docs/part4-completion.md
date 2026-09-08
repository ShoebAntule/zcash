# Part 4 Completion Record

## Implemented

### Phase 25

- dedicated test-recipient setup procedure;
- interactive helper stores only the public address;
- explicit secret boundary.

### Phase 26

- payment recipient is backend environment configuration;
- frontend obtains it from `/api/poc/payment-config`.

### Phase 27

- temporary payment diagnostic UI.

### Phase 28

- Noir `sendTransaction({ to, amount, fundingSource: "shielded" })`.

### Phase 29

- approval-review instructions in the live UI and test checklist.

### Phase 30

- no user signing secret in frontend/backend API design.

### Phase 31

- txid persisted to local storage immediately after SDK success.

### Phase 32

- explicit transaction state model.

### Phase 33

- trusted RPC transaction existence/confirmation endpoint.

### Phase 34

- configurable confirmation threshold, default 1 for the test POC.

### Phase 35

- insufficient-funds error state.

### Phase 36

- rejection returns to a non-submitted state with no txid.

### Phase 37

- verifier/RPC outage keeps txid and prevents duplicate payment.

## Critical finding carried forward

For shielded ZEC, public chain lookup of a txid is **not sufficient production proof of payment recipient and amount**.

Part 4 intentionally verifies only transaction existence/confirmation. A later production payment-verification phase must use a merchant-controlled wallet/viewing mechanism or another proven shielded-payment verification design.

## Operational status

Code implementation: COMPLETE.

Real wallet/RPC experiment: PENDING developer-machine testnet run.

Do not use real ZEC for this stage.
