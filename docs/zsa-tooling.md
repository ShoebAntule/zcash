# ZSA Tooling — Phase 38

Stage D remains pending. This document only prepares ZSA tooling research and setup.
No assets are issued, no issuer secrets are generated, no funds are sent, and no mint UI is started.

## 1. Official sources and pinned versions

### ZSA specification

- ZIP-226 (transfer and burn): https://zip.zcash.dev/ZIP/226.html
- ZIP-227 (issuance): https://zip.zcash.dev/ZIP/227.html
- OrchardZSA audit (Least Authority, January 2025): referenced from https://qed-it.com/zsa-hub/

### ZSA testnet node

- Maintainer repository: https://github.com/zcash-shielded-assets/zebra
- Deployed commit (confirmed by maintainer hanh, 2026-09-01): `6a91831a6a9c18f667f59ab956c9437bf0bb5c5f`
- Zebra version on testnet: 5.0.0 / NU7
- Network upgrade: NU 6.2 activated, Ironwood not yet activated on this testnet
- Documentation: https://hhanh00.github.io/zkool2/zsa/testnet.html

### zcash_tx_tool (transaction construction)

- Repository: https://github.com/QED-it/zcash_tx_tool
- Latest release at time of research: v0.5.0 (2026-05-18)
- Commit: `71e7ca1aa1869e6377ace167cf452eec184da1ad`
- Docker image (public ECR): `public.ecr.aws/j7v0v6n9/tx-tool:latest`
- Wiki: https://github.com/QED-it/zcash_tx_tool/wiki/Running-tx-tool

### zkool wallet (GUI)

- Repository: https://github.com/hhanh00/zkool2
- Latest release at time of research: zkool-v6.25.0 (2026-07-27)
- Commit with ZSA support: `4fd9c66f1bc620ddc4821fe9d2279ac58b1a81c3` and follow-up commits
- Windows binary available in release assets: `zkool-6.25.0+328.exe` (26.4 MB)

## 2. Network distinction from Noir testnet

|                      | Noir Wallet testnet                                                        | ZSA testnet                                            |
| -------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| Purpose              | ZEC payment testing                                                        | ZSA issuance / transfer / burn testing                 |
| Address prefix       | `u1...` (mainnet unified) or testnet unified `utest1...` / `ut1...`        | `uregtest1...`                                         |
| Node software        | Noir extension manages wallet keys; uses standard Zcash testnet or mainnet | ZSA-enabled Zebra (`zcash-shielded-assets/zebra` fork) |
| Lightwalletd         | Not applicable for Noir testnet extension                                  | `https://zsa.methyl.cc`                                |
| Faucet               | Noir testnet faucet (separate)                                             | `https://faucet.zsa.methyl.cc` (tZEC test funds)       |
| Our project variable | `ZCASH_NETWORK=testnet`                                                    | `ZSA_NETWORK=zsa-test` (currently unused placeholder)  |

These are **different networks**. A Noir testnet address (`u...`) is not a ZSA testnet address (`uregtest1...`).
Do not conflate them.

## 3. Required tooling

### Mandatory (to interact with ZSA testnet)

1. **ZSA-enabled wallet or CLI**
   - Preferred CLI: `zcash_tx_tool` (Rust, source build or Docker)
   - Preferred GUI: `zkool` v6.25.0+ (Windows `.exe` available)

2. **ZSA testnet lightwalletd endpoint**
   - `https://zsa.methyl.cc`
   - No local node required for initial experiments; the public testnet node is maintained by the ZSA maintainers.

### Optional conveniences

- Local Zebra node (if you need private testnet control or block mining)
- `zkool_graphql` (GraphQL server wrapping zkool wallet for application integration)
- PostgreSQL (`psql`) — already listed in project prerequisites for later database stages

## 4. Platform support

| Tool                     | Windows native                                                                                  | WSL2 | Docker           |
| ------------------------ | ----------------------------------------------------------------------------------------------- | ---- | ---------------- |
| zkool wallet             | Yes (`.exe` in release assets)                                                                  | Yes  | N/A              |
| zcash_tx_tool            | Not documented; Rust supports Windows but project targets Linux                                 | Yes  | Yes              |
| Docker image for tx-tool | Host networking requires Linux; Docker Desktop on Windows does **not** support `--network host` | Yes  | Yes (Linux host) |

**Smallest documented setup for this Windows machine:**

- Use the prebuilt `zkool` Windows `.exe` for wallet operations.
- For transaction construction/issuance, either:
  - Use WSL2 with Rust + `zcash_tx_tool` source build, **or**
  - Use the public `zcash_tx_tool` Docker image from a Linux environment.

## 5. Noir SDK compatibility with ZSA

From `@noir-wallet/sdk@0.1.9` (installed in `frontend`):

- The public dApp SDK exposes only `wallet.zcash.*` methods: `connect`, `getAccounts`, `getBalance`, `sendTransaction`, `getMaxTransfer`, `signMessage`, `shieldFunds`, `getTransactionHistory`, `disconnect`.
- **No ZSA issuance, transfer, or asset methods are exposed in the public dApp SDK.**
- `switchNetwork()` is deprecated and returns `Promise<never>`. Network is determined by which Noir Wallet extension build the user has installed (mainnet vs testnet).
- The Noir testnet extension is for **ZEC** on testnet, not for ZSA experiments.

**This is a documented limitation, not a bug.** ZSA support in Noir Wallet (if planned) would be a separate extension/SDK release.

## 6. Commands actually executed and results

### Prerequisite check (existing script)

```bash
npm run check:prereqs
```

Result: PostgreSQL client (`psql`) not found. Noir testnet extension is a manual check. ZSA tooling was previously `PENDING_SELECTION`.

### Repository inspection

- No `zcash_tx_tool`, `zkool`, or ZSA-specific scripts exist in the repository.
- `backend/.env.example` contains `ZSA_NETWORK=zsa-test`, `ZSA_RPC_URL=`, `ZSA_CLI_PATH=` placeholders.
- `docs/prerequisites.md` explicitly states: _"We intentionally do not invent or pin a ZSA CLI here."_

### Web research

- Confirmed ZSA testnet is distinct from Noir testnet.
- Confirmed `zcash_tx_tool` v0.5.0 and `zkool` v6.25.0 are the current maintainer-supported tools.
- Confirmed `assetBurn` is parsed in the deployed Zebra commit but handling status is unknown (maintainer: "I don't know if it is handled").
- Confirmed public testnet node is at `dev.zebra.zsa-test.net:443` (HTTPS) and `zsa.methyl.cc` (lightwalletd).

## 7. Remaining installation steps or blockers

### Blocker: No ZSA tooling is installed on this machine

Current machine state:

- OS: Windows 64-bit
- WSL: **Not installed**
- Docker: **Not installed**
- Rust/Cargo: **Not installed**
- zkool: **Not installed**

### Required manual steps (do not run silently)

**Option A — zkool wallet (smallest setup, Windows native)**

1. Download `zkool-6.25.0+328.exe` from https://github.com/hhanh00/zkool2/releases/tag/zkool-v6.25.0
2. Run the installer.
3. Open zkool → Settings → Database Manager → Create a new database with a name containing `zsa` (e.g., `zsa-testnet`).
4. Set Server URL to `https://zsa.methyl.cc`.
5. Create an account.
6. Use the ZSA testnet faucet at `https://faucet.zsa.methyl.cc` to get tZEC for fees.

**Option B — zcash_tx_tool via WSL2 (for issuance/transfer scripting)**

1. Install WSL2: `wsl.exe --install` (requires administrator, reboot)
2. In WSL2 (Ubuntu), install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
3. Clone and build:
   ```bash
   git clone https://github.com/QED-it/zcash_tx_tool.git
   cd zcash_tx_tool
   cargo build --release
   ```
4. Run against public testnet:
   ```bash
   export ZCASH_NODE_ADDRESS=dev.zebra.zsa-test.net
   export ZCASH_NODE_PORT=443
   export ZCASH_NODE_PROTOCOL=https
   ./target/release/zcash_tx_tool test-orchard-zsa
   ```

**Option C — zcash_tx_tool via Linux Docker host**

Requires a Linux host with Docker. Docker Desktop on Windows does **not** support `--network host`.
Use the public ECR image:

```bash
docker run --pull=always \
  -e ZCASH_NODE_ADDRESS=dev.zebra.zsa-test.net \
  -e ZCASH_NODE_PORT=443 \
  -e ZCASH_NODE_PROTOCOL=https \
  public.ecr.aws/j7v0v6n9/tx-tool:latest
```

## 8. Documented Noir compatibility limitations (separated from untested)

### Confirmed limitations (from SDK types/README)

- No ZSA methods in public dApp SDK (`@noir-wallet/sdk@0.1.9`).
- `switchNetwork()` is deprecated and ineffective.
- Network is determined by installed extension build (mainnet vs testnet).

### Needs testing (not confirmed)

- Whether the Noir Wallet testnet extension can display or interact with ZSA testnet addresses (`uregtest1...`).
- Whether Noir Wallet plans to expose ZSA issuance/transfer APIs in a future SDK version.
- Whether `assetBurn` transactions are accepted by the live ZSA testnet node at commit `6a91831a`.

## 9. What this project does not yet have

- No local ZSA node.
- No `zcash_tx_tool` binary or source checkout.
- No `zkool` installation.
- No issuer credentials or asset definitions.
- No database schema for ZSA metadata.
- No backend route or service for ZSA issuance.

## 10. Next action

**Install zkool (Windows native) or set up WSL2 + Rust + zcash_tx_tool manually.**

Do not proceed to Phase 39 (connecting to ZSA infrastructure) until one of the above tooling paths is installed and you can:

1. Create a ZSA testnet account.
2. Receive tZEC from the faucet.
3. Run a documented `zcash_tx_tool` scenario or zkool issuance flow against the public ZSA testnet.

Phase 38 status: **PARTIAL** — research complete, tooling not yet installed.
