import { describe, expect, it } from 'vitest';
import { classifyZcashAddress, shortenAddress } from './address';

describe('shortenAddress', () => {
  it('shortens long addresses', () => {
    expect(shortenAddress('u1234567890abcdefghijklmnopqrstuvwxyz', 6, 4)).toBe('u12345…wxyz');
  });

  it('returns an em dash for empty values', () => {
    expect(shortenAddress(null)).toBe('—');
  });
});

describe('classifyZcashAddress', () => {
  it('classifies unified/shielded-looking addresses', () => {
    expect(classifyZcashAddress('u1example')).toBe('shielded');
    expect(classifyZcashAddress('zs1example')).toBe('shielded');
  });

  it('classifies transparent-looking addresses', () => {
    expect(classifyZcashAddress('t1example')).toBe('transparent');
  });
});
