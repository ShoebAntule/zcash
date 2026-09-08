export function shortenAddress(value: string | null | undefined, head = 10, tail = 8): string {
  if (!value) return '—';
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function classifyZcashAddress(
  value: string | null | undefined,
): 'shielded' | 'transparent' | 'unknown' {
  if (!value) return 'unknown';

  const lower = value.toLowerCase();

  // Unified Addresses begin with "u". Noir documents the connected primary
  // shielded address separately, so this classifier is only for display hints.
  if (lower.startsWith('u') || lower.startsWith('zs')) return 'shielded';

  // Zcash transparent P2PKH/P2SH addresses commonly begin with t1/t3 on mainnet;
  // testnet variants can differ. We still use the provider field itself as the
  // authoritative capability label wherever available.
  if (lower.startsWith('t')) return 'transparent';

  return 'unknown';
}
