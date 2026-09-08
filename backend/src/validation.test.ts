import { describe, expect, it } from 'vitest';
import { isLikelyTxid } from './validation.js';

describe('isLikelyTxid', () => {
  it('accepts a 64-character hexadecimal transaction id', () => {
    expect(isLikelyTxid('a'.repeat(64))).toBe(true);
  });

  it('rejects malformed values', () => {
    expect(isLikelyTxid('not-a-txid')).toBe(false);
    expect(isLikelyTxid('g'.repeat(64))).toBe(false);
  });
});
