import { describe, expect, it } from 'vitest';
import { classifyWalletError } from './errors';

describe('classifyWalletError', () => {
  it('maps explicit user rejection to USER_REJECTED', () => {
    expect(classifyWalletError({ code: 4001, message: 'User rejected' })).toBe('USER_REJECTED');
  });

  it('maps missing-wallet messages', () => {
    expect(classifyWalletError(new Error('Noir Wallet is not installed.'))).toBe('NOT_INSTALLED');
  });

  it('maps generic provider errors', () => {
    expect(classifyWalletError(new Error('Provider request failed'))).toBe('PROVIDER_ERROR');
  });
});
