import { describe, it, expect } from 'vitest';
import { toZatoshi, toZec } from './money.js';
describe('exact payment arithmetic', () => {
  it('preserves a single zatoshi', () => expect(toZatoshi('0.00000001')).toBe(1n));
  it('multiplies without floating point rounding', () =>
    expect(toZec(toZatoshi('0.1') * 3n)).toBe('0.30000000'));
  it.each(['-1', '1e3', 'NaN', '0.000000001', '01', '1.'])('rejects %s', (value) =>
    expect(() => toZatoshi(value)).toThrow(),
  );
});
