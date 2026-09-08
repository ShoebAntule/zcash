const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface PaymentConfig {
  network: string;
  recipient: string;
  amountZec: string;
  fundingSource: 'shielded';
  requiredConfirmations: number;
}

export type VerificationState =
  'NOT_FOUND' | 'CONFIRMING' | 'CONFIRMED' | 'RPC_ERROR' | 'INSUFFICIENT_PROOF';

export interface TransactionVerification {
  txid: string;
  state: VerificationState;
  confirmations: number;
  requiredConfirmations: number;
  blockHash: string | null;
  error?: string;
}

export async function fetchPaymentConfig(signal?: AbortSignal): Promise<PaymentConfig> {
  const response = await fetch(`${API_BASE_URL}/api/poc/payment-config`, { signal });

  if (!response.ok) {
    throw new Error(`Payment config request failed (${response.status})`);
  }

  return response.json() as Promise<PaymentConfig>;
}

export async function verifyPaymentTx(
  txid: string,
  signal?: AbortSignal,
): Promise<TransactionVerification> {
  const response = await fetch(
    `${API_BASE_URL}/api/poc/transactions/${encodeURIComponent(txid)}/verify`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal,
    },
  );

  const payload = (await response.json()) as TransactionVerification & {
    message?: string;
  };

  if (response.status === 503 && payload.state === 'RPC_ERROR') {
    return payload;
  }

  if (!response.ok) {
    throw new Error(payload.message || `Verification request failed (${response.status})`);
  }

  return payload;
}
