import { describe, expect, it } from 'vitest';
import { hasEnoughAvailableZec } from './payment';

describe('hasEnoughAvailableZec', () => {
  it('uses exact zatoshi arithmetic', () => {
    expect(hasEnoughAvailableZec('0.00100000', '0.001')).toBe(true);
    expect(hasEnoughAvailableZec('0.00099999', '0.001')).toBe(false);
  });

  it('does not use floating point assumptions', () => {
    expect(hasEnoughAvailableZec('0.3', '0.30000000')).toBe(true);
  });
});
