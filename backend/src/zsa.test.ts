import { it, expect } from 'vitest';
import { createZsaProvider } from './zsa-providers.js';

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
