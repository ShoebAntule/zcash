import { describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { createZsaProvider } from './zsa-providers.js';

describe('zsa provider fail-closed behavior', () => {
  const disabled = createZsaProvider('disabled');
  const txTool = createZsaProvider('tx-tool');
  const zkool = createZsaProvider('zkool-graphql');
  const unknown = createZsaProvider('unknown');

  it('disabled provider returns ZSA_PROVIDER_NOT_CONFIGURED for all operations', async () => {
    const issue = await disabled.issueAsset({ assetIdentifier: 'a'.repeat(64) });
    expect(issue.ok).toBe(false);
    expect(issue.code).toBe('ZSA_PROVIDER_NOT_CONFIGURED');

    const transfer = await disabled.transferAsset({
      assetIdentifier: 'a'.repeat(64),
      recipientAddress: 'uregtest1q...',
    });
    expect(transfer.ok).toBe(false);
    expect(transfer.code).toBe('ZSA_PROVIDER_NOT_CONFIGURED');

    const status = await disabled.getAssetStatus('a'.repeat(64));
    expect(status.ok).toBe(false);
    expect(status.code).toBe('ZSA_PROVIDER_NOT_CONFIGURED');

    const holding = await disabled.getRecipientHolding('a'.repeat(64), 'uregtest1q...');
    expect(holding.ok).toBe(false);
    expect(holding.code).toBe('ZSA_PROVIDER_NOT_CONFIGURED');

    const verify = await disabled.verifyTransfer('00000000-0000-4000-8000-000000000001');
    expect(verify.ok).toBe(false);
    expect(verify.code).toBe('ZSA_PROVIDER_NOT_CONFIGURED');
  });

  it('tx-tool provider returns ZSA_TRANSFER_UNAVAILABLE for all operations', async () => {
    const issue = await txTool.issueAsset({ assetIdentifier: 'a'.repeat(64) });
    expect(issue.ok).toBe(false);
    expect(issue.code).toBe('ZSA_TRANSFER_UNAVAILABLE');

    const transfer = await txTool.transferAsset({
      assetIdentifier: 'a'.repeat(64),
      recipientAddress: 'uregtest1q...',
    });
    expect(transfer.ok).toBe(false);
    expect(transfer.code).toBe('ZSA_TRANSFER_UNAVAILABLE');
  });

  it('zkool-graphql provider returns ZSA_TRANSFER_UNAVAILABLE for all operations', async () => {
    const status = await zkool.getAssetStatus('a'.repeat(64));
    expect(status.ok).toBe(false);
    expect(status.code).toBe('ZSA_TRANSFER_UNAVAILABLE');
  });

  it('unknown provider falls back to disabled', async () => {
    const result = await unknown.issueAsset({ assetIdentifier: 'a'.repeat(64) });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('ZSA_PROVIDER_NOT_CONFIGURED');
  });

  it('providers never return data with ok=true while unverified', async () => {
    const providers = [disabled, txTool, zkool, unknown];
    for (const provider of providers) {
      const issue = await provider.issueAsset({ assetIdentifier: 'a'.repeat(64) });
      expect(issue.ok).toBe(false);
      expect(issue.data).toBeUndefined();

      const transfer = await provider.transferAsset({
        assetIdentifier: 'a'.repeat(64),
        recipientAddress: 'uregtest1q...',
      });
      expect(transfer.ok).toBe(false);
      expect(transfer.data).toBeUndefined();
    }
  });

  it('zkool-graphql provider dryRunTransfer returns validated mutation without broadcasting', async () => {
    const result = await zkool.dryRunTransfer({
      assetIdentifier: 'a'.repeat(64),
      recipientAddress: 'uregtest1q...',
      amount: 1,
    });
    expect(result.ok).toBe(true);
    expect(result.data?.mutation).toContain('mutation TransferAsset');
    expect(result.data?.mutation).toContain('pay(id_account: $id_account');
    expect(result.data?.endpoint).toBe('http://localhost:8000/graphql');
    expect(result.data?.needsWalletPassword).toBe(true);
    expect(result.data?.needsJwt).toBe(true);
    expect(result.data?.variables).toBeDefined();
  });

  it('disabled provider dryRunTransfer returns ZSA_PROVIDER_NOT_CONFIGURED', async () => {
    const result = await disabled.dryRunTransfer({
      assetIdentifier: 'a'.repeat(64),
      recipientAddress: 'uregtest1q...',
      amount: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('ZSA_PROVIDER_NOT_CONFIGURED');
    expect(result.data).toBeUndefined();
  });

  it('tx-tool provider dryRunTransfer returns ZSA_TRANSFER_UNAVAILABLE', async () => {
    const result = await txTool.dryRunTransfer({
      assetIdentifier: 'a'.repeat(64),
      recipientAddress: 'uregtest1q...',
      amount: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('ZSA_TRANSFER_UNAVAILABLE');
    expect(result.data).toBeUndefined();
  });
});

describe('zsa schema constraints', () => {
  it('enforces valid provider and status values', async () => {
    const db = new PGlite();
    try {
      await db.exec(await readFile(new URL('../../database/002_zsa.sql', import.meta.url), 'utf8'));
      await expect(
        db.query(
          'INSERT INTO zsa_assets(id, asset_identifier, provider, status) VALUES($1,$2,$3,$4)',
          ['1', 'a'.repeat(64), 'invalid', 'PENDING'],
        ),
      ).rejects.toThrow();
      await expect(
        db.query(
          'INSERT INTO zsa_transfers(id, asset_identifier, provider, status) VALUES($1,$2,$3,$4)',
          ['1', 'a'.repeat(64), 'invalid', 'PENDING'],
        ),
      ).rejects.toThrow();
      await db.query(
        `INSERT INTO zsa_assets(id, asset_identifier, provider, status) VALUES($1,$2,$3,$4)`,
        ['1', 'a'.repeat(64), 'disabled', 'PENDING'],
      );
      await db.query(
        `INSERT INTO zsa_transfers(id, asset_identifier, provider, status) VALUES($1,$2,$3,$4)`,
        ['1', 'a'.repeat(64), 'disabled', 'PENDING'],
      );
    } finally {
      await db.close();
    }
  }, 30000);
});
