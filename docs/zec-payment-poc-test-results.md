# ZEC Payment POC — Manual Test Results

Use only Noir testnet and test ZEC.

| Test                        | Expected                                                     | Result  | Notes |
| --------------------------- | ------------------------------------------------------------ | ------- | ----- |
| Dedicated recipient created | Separate test wallet; public address only in backend env     | PENDING |       |
| Payment config              | Recipient/amount come from backend                           | PENDING |       |
| Send click                  | Noir opens approval                                          | PENDING |       |
| Approval review             | Correct recipient, amount, network, funding source, fee      | PENDING |       |
| Reject                      | USER_REJECTED; no txid                                       | PENDING |       |
| Insufficient funds          | INSUFFICIENT_FUNDS; recoverable                              | PENDING |       |
| Approve/broadcast           | txid returned and persisted                                  | PENDING |       |
| Refresh after txid          | Send remains disabled; verification resumes                  | PENDING |       |
| Independent existence check | Trusted RPC finds tx                                         | PENDING |       |
| Confirmations               | CONFIRMED after configured threshold                         | PENDING |       |
| RPC outage after txid       | NETWORK_ERROR; no resend button                              | PENDING |       |
| RPC recovery                | Existing txid verification resumes                           | PENDING |       |
| Disconnect after submission | txid remains recoverable                                     | PENDING |       |
| No secrets                  | No seed/private/spending key appears in browser/backend/logs | PENDING |       |

## Recorded test values

```text
Network:
Amount:
Recipient (shortened):
Txid:
Block hash:
Required confirmations:
Observed confirmations:
```

## Build gate

```text
npm install:
PENDING ON DEVELOPER MACHINE

npm run check:
PENDING ON DEVELOPER MACHINE
```
