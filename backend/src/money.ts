export function toZatoshi(value: string): bigint {
  if (!/^(0|[1-9]\d*)(\.\d{1,8})?$/.test(value)) throw new Error('Invalid ZEC amount');
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * 100000000n + BigInt(fraction.padEnd(8, '0'));
}
export function toZec(value: string | bigint): string {
  const n = BigInt(value);
  return `${n / 100000000n}.${(n % 100000000n).toString().padStart(8, '0')}`;
}
