import { describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { assertMintable, expireReservations } from './orders.js';

describe('order hardening', () => {
  it('assertMintable rejects missing payment and asset evidence', () => {
    expect(() => assertMintable({})).toThrow('payment not verified');
    expect(() => assertMintable({ payment_txid: 'a'.repeat(64) })).toThrow(
      'asset evidence missing',
    );
    expect(() =>
      assertMintable({ payment_txid: 'a'.repeat(64), asset_identifier: 'b'.repeat(64) }),
    ).not.toThrow();
  });

  it('migration enforces unique serials, payment reuse, minted evidence, and expiry cleanup', async () => {
    const db = new PGlite();
    try {
      await db.exec(
        await readFile(new URL('../../database/001_initial.sql', import.meta.url), 'utf8'),
      );
      await db.exec("INSERT INTO collections VALUES('test','Test',2,100000,2,'PAUSED')");
      await db.exec("INSERT INTO assets(collection_id,serial,name) VALUES('test',1,'One')");
      await expect(
        db.exec("INSERT INTO assets(collection_id,serial,name) VALUES('test',1,'Duplicate')"),
      ).rejects.toThrow();
      await expect(db.exec("UPDATE assets SET status='MINTED'")).rejects.toThrow();
      const id = '00000000-0000-4000-8000-000000000001';
      await db.query(
        "INSERT INTO mint_orders(id,collection_id,access_hash,quantity,total_zatoshi,status,expires_at,payment_txid) VALUES($1,'test','hash',1,100000,'PAYMENT_SUBMITTED',now(),$2)",
        [id, 'a'.repeat(64)],
      );
      await expect(
        db.query(
          "INSERT INTO mint_orders(id,collection_id,access_hash,quantity,total_zatoshi,status,expires_at,payment_txid) VALUES($1,'test','hash',1,100000,'PAYMENT_SUBMITTED',now(),$2)",
          ['00000000-0000-4000-8000-000000000002', 'a'.repeat(64)],
        ),
      ).rejects.toThrow();
      await db.query("UPDATE assets SET status='RESERVED',order_id=$1", [id]);
      await db.exec('BEGIN');
      await db.exec("UPDATE assets SET status='AVAILABLE',order_id=NULL");
      await db.exec('ROLLBACK');
      const result = await db.query<{ status: string }>('SELECT status FROM assets');
      expect(result.rows[0].status).toBe('RESERVED');
      const expiredId = '00000000-0000-4000-8000-000000000003';
      await db.query(
        `INSERT INTO mint_orders(id,collection_id,access_hash,quantity,total_zatoshi,status,expires_at)
         VALUES($1,'test','hash',1,100000,'RESERVED',now()-interval '1 minute')`,
        [expiredId],
      );
      await db.query("UPDATE assets SET status='RESERVED',order_id=$1 WHERE id=1", [expiredId]);
      const expiredRows = await db.query("SELECT id FROM mint_orders WHERE status='EXPIRED'");
      expect(expiredRows.rowCount).toBe(0);
      await db.query(`UPDATE mint_orders SET expires_at=now()-interval '1 minute' WHERE id=$1`, [
        expiredId,
      ]);
      await expireReservations(db);
      const expiredAfter = await db.query("SELECT id FROM mint_orders WHERE status='EXPIRED'");
      expect(expiredAfter.rowCount).toBe(1);
      const assetAfter = await db.query<{ status: string }>('SELECT status FROM assets WHERE id=1');
      expect(assetAfter.rows[0].status).toBe('AVAILABLE');
    } finally {
      await db.close();
    }
  }, 30000);
});
