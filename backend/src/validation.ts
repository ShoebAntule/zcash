export function isLikelyTxid(value: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(value);
}
