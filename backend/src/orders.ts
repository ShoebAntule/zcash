import { Router } from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { pool } from './db.js';
import { toZec } from './money.js';
import { emitOrderEvent } from './events.js';

export const orders = Router();
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const blockers = [
  'Shielded payment receipt verifier not implemented',
  'ZSA issuance and Noir recipient control not proven',
];

export async function expireReservations(db: unknown): Promise<void> {
  const client = db as {
    query(sql: string, params?: unknown[]): Promise<{ rowCount: number; rows: unknown[] }>;
  };
  const expired = await client.query(
    `SELECT id FROM mint_orders WHERE status='RESERVED' AND expires_at<now() FOR UPDATE`,
  );
  if (expired.rowCount) {
    const ids = (expired.rows as { id: string }[]).map((r) => r.id);
    await client.query(
      `UPDATE assets SET status='AVAILABLE',order_id=NULL WHERE order_id=ANY($1::uuid[])`,
      [ids],
    );
    await client.query(
      "UPDATE mint_orders SET status='EXPIRED',updated_at=now() WHERE id=ANY($1::uuid[])",
      [ids],
    );
    for (const id of ids) {
      await emitOrderEvent(id, 'RESERVATION_EXPIRED');
    }
  }
}

orders.get('/readiness', async (_req, res) => {
  let database = false;
  try {
    database = !!(await pool?.query('SELECT id FROM collections LIMIT 1'));
  } catch {
    /* fail closed */
  }
  res.json({
    ready: false,
    database,
    network: 'testnet',
    blockers: [...(!database ? ['Database unavailable or not migrated'] : []), ...blockers],
  });
});

orders.get('/config', async (_req, res) => {
  if (!pool) {
    res.status(503).json({ message: 'Set DATABASE_URL and run migrations.' });
    return;
  }
  const result =
    await pool.query(`SELECT c.*, count(a.id) FILTER(WHERE a.status='AVAILABLE')::int AS available,
    count(a.id) FILTER(WHERE a.status='MINTED')::int AS minted FROM collections c
    LEFT JOIN assets a ON a.collection_id=c.id WHERE c.id='chomp-test' GROUP BY c.id`);
  if (!result.rowCount) {
    res.status(503).json({ message: 'Run the test collection seed command.' });
    return;
  }
  const c = result.rows[0];
  res.json({
    ...c,
    priceZec: toZec(c.price_zatoshi),
    network: 'testnet',
    mintEnabled: false,
    blockers,
    previewEnabled:
      process.env.NODE_ENV === 'development' && process.env.ENABLE_RESERVATION_PREVIEW === 'true',
  });
});

// This route is deliberately a development inventory exercise, NOT payment authorization.
orders.post('/preview-reservations', async (req, res) => {
  if (process.env.NODE_ENV !== 'development' || process.env.ENABLE_RESERVATION_PREVIEW !== 'true') {
    res.status(403).json({ message: 'Reservation preview is disabled.' });
    return;
  }
  if (!pool) {
    res.status(503).json({ message: 'Database not configured.' });
    return;
  }
  const { quantity, requestId, accessToken } = req.body ?? {};
  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    !uuid.test(requestId ?? '') ||
    typeof accessToken !== 'string' ||
    !/^[0-9a-f]{64}$/.test(accessToken)
  ) {
    res.status(400).json({ message: 'Invalid quantity or recovery credentials.' });
    return;
  }
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const c = (await db.query("SELECT * FROM collections WHERE id='chomp-test' FOR UPDATE"))
      .rows[0];
    if (!c) throw new Error('Seed collection first');
    if (quantity > c.max_per_tx) {
      await db.query('ROLLBACK');
      res.status(400).json({ message: 'Quantity exceeds limit.' });
      return;
    }
    const existing = (await db.query('SELECT * FROM mint_orders WHERE id=$1', [requestId])).rows[0];
    if (existing) {
      await db.query('ROLLBACK');
      if (existing.access_hash !== hash(accessToken) || existing.quantity !== quantity) {
        res.status(409).json({ message: 'Request conflicts with existing order.' });
        return;
      }
      await emitOrderEvent(requestId, 'RESERVATION_DUPLICATE');
      res.json({
        id: existing.id,
        status: existing.status,
        totalZec: toZec(existing.total_zatoshi),
        expiresAt: existing.expires_at,
      });
      return;
    }
    await expireReservations(db);
    const selected = await db.query(
      "SELECT id FROM assets WHERE collection_id=$1 AND status='AVAILABLE' ORDER BY serial LIMIT $2 FOR UPDATE",
      [c.id, quantity],
    );
    if (selected.rowCount !== quantity) {
      await db.query('ROLLBACK');
      res.status(409).json({ message: 'Not enough available items.' });
      return;
    }
    const total = (BigInt(c.price_zatoshi) * BigInt(quantity)).toString();
    const result = await db.query(
      `INSERT INTO mint_orders(id,collection_id,access_hash,quantity,total_zatoshi,status,expires_at)
      VALUES($1,$2,$3,$4,$5,'RESERVED',now()+interval '15 minutes') RETURNING expires_at`,
      [requestId, c.id, hash(accessToken), quantity, total],
    );
    await db.query("UPDATE assets SET status='RESERVED',order_id=$1 WHERE id=ANY($2::bigint[])", [
      requestId,
      selected.rows.map((r) => r.id),
    ]);
    await emitOrderEvent(requestId, 'DEVELOPMENT_RESERVATION_CREATED');
    await db.query('COMMIT');
    res.status(201).json({
      id: requestId,
      status: 'RESERVED',
      totalZec: toZec(total),
      expiresAt: result.rows[0].expires_at,
    });
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    db.release();
  }
});

orders.get('/orders/:id', async (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer /, '') ?? '';
  if (!uuid.test(String(req.params.id)) || !/^[0-9a-f]{64}$/.test(token)) {
    res.status(404).json({ message: 'Order not found.' });
    return;
  }
  if (!pool) {
    res.status(503).json({ message: 'Database unavailable.' });
    return;
  }
  const o = (
    await pool.query('SELECT * FROM mint_orders WHERE id=$1 AND access_hash=$2', [
      req.params.id,
      hash(token),
    ])
  ).rows[0];
  if (!o) {
    res.status(404).json({ message: 'Order not found.' });
    return;
  }
  res.json({
    id: o.id,
    status: o.status,
    totalZec: toZec(o.total_zatoshi),
    expiresAt: o.expires_at,
  });
});

// Payment and issuance routes remain intentionally disabled until verified.
orders.post('/reserve', (_req, res) => res.status(503).json({ code: 'MINT_NOT_READY', blockers }));
orders.post('/orders/:id/payment', (_req, res) =>
  res.status(503).json({ code: 'MINT_NOT_READY', blockers }),
);

interface MintableOrder {
  payment_txid?: string;
  asset_identifier?: string;
}

// Guard: a real implementation must never set MINTED without both payment and asset evidence.
export function assertMintable(order: MintableOrder): void {
  if (!order.payment_txid) {
    throw new Error('Cannot mint: payment not verified.');
  }
  if (!order.asset_identifier) {
    throw new Error('Cannot mint: asset evidence missing.');
  }
}

export const requestReference = () => randomUUID();
