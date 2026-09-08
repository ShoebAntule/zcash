export type WalletErrorKind =
  'USER_REJECTED' | 'NOT_INSTALLED' | 'NOT_CONNECTED' | 'PROVIDER_ERROR' | 'UNKNOWN';

type ErrorLike = {
  code?: unknown;
  name?: unknown;
  message?: unknown;
};

export function classifyWalletError(error: unknown): WalletErrorKind {
  if (!error || typeof error !== 'object') return 'UNKNOWN';

  const candidate = error as ErrorLike;
  const code = candidate.code;
  const name = String(candidate.name ?? '').toLowerCase();
  const message = String(candidate.message ?? '').toLowerCase();

  // 4001 is the standard EIP-1193-style rejection code used by many browser
  // wallets. Noir's public docs do not guarantee a single rejection code, so
  // we also recognize unambiguous rejection/cancel wording.
  if (
    code === 4001 ||
    name.includes('reject') ||
    message.includes('user rejected') ||
    message.includes('user denied') ||
    message.includes('cancelled') ||
    message.includes('canceled')
  ) {
    return 'USER_REJECTED';
  }

  if (message.includes('not installed') || message.includes('install noir')) {
    return 'NOT_INSTALLED';
  }

  if (message.includes('not connected') || message.includes('unauthorized')) {
    return 'NOT_CONNECTED';
  }

  if (message) return 'PROVIDER_ERROR';
  return 'UNKNOWN';
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '');
    if (message) return message;
  }
  return 'An unexpected Noir Wallet error occurred.';
}
