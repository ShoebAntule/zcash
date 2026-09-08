# Noir POC Manual Test Results

Run this on the actual developer browser with the official Noir **testnet** extension.

| Test                                     | Expected                               | Result  | Notes |
| ---------------------------------------- | -------------------------------------- | ------- | ----- |
| No extension                             | `NOT_INSTALLED`                        | PENDING |       |
| Extension installed, site not authorized | `DISCONNECTED`                         | PENDING |       |
| Connect click                            | Noir approval UI opens                 | PENDING |       |
| Reject connection                        | `USER_REJECTED`, no account data       | PENDING |       |
| Approve connection                       | `CONNECTED`, authorized data displayed | PENDING |       |
| Shielded address                         | Present if returned by Noir            | PENDING |       |
| Transparent address                      | Present if returned by Noir            | PENDING |       |
| Available balance                        | Reads with `getBalance(accountId)`     | PENDING |       |
| Account change                           | UI re-queries authorized state         | PENDING |       |
| Disconnect                               | Wallet data cleared                    | PENDING |       |
| Reload after authorized connection       | Silent `getAccounts()` restoration     | PENDING |       |

## Build verification

```text
npm install:
PENDING ON DEVELOPER MACHINE

npm run check:
PENDING ON DEVELOPER MACHINE
```

Do not mark Part 3 fully verified until the real extension tests pass.
