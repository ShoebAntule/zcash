export function hasEnoughAvailableZec(
  available: string | number | bigint | null | undefined,
  amount: string,
): boolean | null {
  if (available === null || available === undefined) return null;

  const toZatoshis = (value: string): bigint | null => {
    if (!/^\d+(?:\.\d{1,8})?$/.test(value)) return null;
    const [whole, fraction = ''] = value.split('.');
    return BigInt(whole) * 100_000_000n + BigInt((fraction + '00000000').slice(0, 8));
  };

  const requested = toZatoshis(amount);
  const availableValue = toZatoshis(String(available));

  if (requested === null || availableValue === null) return null;
  return availableValue >= requested;
}
