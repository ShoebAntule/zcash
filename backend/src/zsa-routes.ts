import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { pool } from './db.js';
import { createZsaProvider } from './zsa-providers.js';
import { loadConfig } from './config.js';

export const zsa = Router();

const config = loadConfig();
const provider = createZsaProvider(config.zsaProvider);

const TXID_RE = /^[0-9a-f]{64}$/i;
const ASSET_RE = /^[0-9a-f]{64}$/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ADDRESS_RE = /^[uUtTzZ][1-9a-km-zA-HJ-NP-Z]{7,}[0-9a-zA-Z]$/i;
const ZSA_ADDRESS_RE = /^uregtest1[1-9a-km-zA-HJ-NP-Z]{7,}[0-9a-zA-Z]$/i;

function assertAssetIdentifier(value: string): void {
  if (!ASSET_RE.test(value)) {
    throw new Error('Expected a 64-character hexadecimal asset identifier.');
  }
}

function assertRecipientAddress(value: string): void {
  if (!ADDRESS_RE.test(value) && !ZSA_ADDRESS_RE.test(value)) {
    throw new Error('Expected a valid Zcash unified or ZSA testnet address.');
  }
}

zsa.get('/status', async (_req, res) => {
  res.json({
    provider: config.zsaProvider,
    network: config.zcashNetwork,
    noirZsaSupport: false,
    message:
      'Noir Wallet SDK 0.1.9 supports ZEC only. ZSA issuance and transfer require zcash_tx_tool or zkool wallet.',
    endpoints: {
      issue: config.zsaProvider === 'disabled' ? false : 'boundary-not-verified',
      transfer: config.zsaProvider === 'disabled' ? false : 'boundary-not-verified',
    },
  });
});

zsa.post('/issue', async (req, res) => {
  if (!pool) {
    res.status(503).json({ message: 'Database not configured.' });
    return;
  }
  const assetIdentifier = String(req.body?.assetIdentifier ?? '');
  try {
    assertAssetIdentifier(assetIdentifier);
  } catch (e) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Invalid asset identifier.' });
    return;
  }

  const result = await provider.issueAsset({ assetIdentifier });
  if (!result.ok) {
    const status = result.code === 'ZSA_PROVIDER_NOT_CONFIGURED' ? 503 : 501;
    res.status(status).json({
      message: result.error,
      code: result.code,
    });
    return;
  }

  // Provider returned a real response; persist it.
  if (result.data) {
    const db = await pool.connect();
    try {
      await db.query('BEGIN');
      const existing = await db.query('SELECT id FROM zsa_assets WHERE asset_identifier=$1', [
        assetIdentifier,
      ]);
      if (existing.rowCount) {
        await db.query(
          'UPDATE zsa_assets SET status=$1, updated_at=now() WHERE asset_identifier=$2',
          [result.data.status, assetIdentifier],
        );
      } else {
        await db.query(
          `INSERT INTO zsa_assets(id, asset_identifier, issuance_txid, provider, status)
           VALUES($1,$2,$3,$4,$5)`,
          [
            result.data.id,
            assetIdentifier,
            result.data.issuanceTxid,
            result.data.provider,
            result.data.status,
          ],
        );
      }
      await db.query('COMMIT');
      res.status(201).json(result.data);
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('ZSA issue persistence failed', error);
      res
        .status(503)
        .json({ message: 'Database error while persisting issuance.', code: 'DATABASE_ERROR' });
    } finally {
      db.release();
    }
    return;
  }

  res.status(500).json({ message: 'Provider returned empty result.', code: 'UNKNOWN_ERROR' });
});

zsa.post('/transfer', async (req, res) => {
  if (!pool) {
    res.status(503).json({ message: 'Database not configured.' });
    return;
  }
  const assetIdentifier = String(req.body?.assetIdentifier ?? '');
  const recipientAddress = String(req.body?.recipientAddress ?? '');
  try {
    assertAssetIdentifier(assetIdentifier);
    assertRecipientAddress(recipientAddress);
  } catch (e) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Invalid input.' });
    return;
  }

  const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
  const transferId = idempotencyKey && TXID_RE.test(idempotencyKey) ? idempotencyKey : randomUUID();

  const result = await provider.transferAsset({ assetIdentifier, recipientAddress });
  if (!result.ok) {
    const status = result.code === 'ZSA_PROVIDER_NOT_CONFIGURED' ? 503 : 501;
    res.status(status).json({
      id: transferId,
      message: result.error,
      code: result.code,
    });
    return;
  }

  if (result.data) {
    const db = await pool.connect();
    try {
      await db.query('BEGIN');
      const existing = await db.query('SELECT id, status FROM zsa_transfers WHERE id=$1', [
        transferId,
      ]);
      if (existing.rowCount) {
        const row = existing.rows[0];
        if (row.status === 'CONFIRMED') {
          await db.query('COMMIT');
          res.status(200).json({ ...result.data, id: transferId, idempotent: true });
          return;
        }
        await db.query('UPDATE zsa_transfers SET status=$1, updated_at=now() WHERE id=$2', [
          result.data.status,
          transferId,
        ]);
      } else {
        await db.query(
          `INSERT INTO zsa_transfers(id, asset_identifier, transfer_txid, provider, status, recipient_address)
           VALUES($1,$2,$3,$4,$5,$6)`,
          [
            transferId,
            assetIdentifier,
            result.data.transferTxid,
            result.data.provider,
            result.data.status,
            recipientAddress,
          ],
        );
      }
      await db.query('COMMIT');
      res.status(202).json({ ...result.data, id: transferId, idempotent: !!existing.rowCount });
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('ZSA transfer persistence failed', error);
      res
        .status(503)
        .json({ message: 'Database error while persisting transfer.', code: 'DATABASE_ERROR' });
    } finally {
      db.release();
    }
    return;
  }

  res.status(500).json({ message: 'Provider returned empty result.', code: 'UNKNOWN_ERROR' });
});

zsa.get('/transfer/:id', async (req, res) => {
  if (!pool) {
    res.status(503).json({ message: 'Database not configured.' });
    return;
  }
  const id = String(req.params.id ?? '');
  if (!UUID_RE.test(id)) {
    res.status(400).json({ message: 'Expected a UUID transfer id.' });
    return;
  }

  const row = (await pool.query('SELECT * FROM zsa_transfers WHERE id=$1', [id])).rows[0];
  if (!row) {
    res.status(404).json({ message: 'Transfer not found.' });
    return;
  }

  const result = await provider.verifyTransfer(id);
  if (!result.ok) {
    res.status(503).json({
      id,
      message: result.error,
      code: result.code,
      persistedStatus: row.status,
    });
    return;
  }

  res.json(result.data ?? { id, status: row.status });
});
