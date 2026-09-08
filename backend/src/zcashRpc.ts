import { toZatoshi } from './money.js';
export type RpcVerificationState =
  'NOT_FOUND' | 'CONFIRMING' | 'CONFIRMED' | 'RPC_ERROR' | 'INSUFFICIENT_PROOF';

export interface TransactionVerification {
  txid: string;
  state: RpcVerificationState;
  confirmations: number;
  requiredConfirmations: number;
  blockHash: string | null;
  error?: string;
}

type RpcResponse<T> = {
  result?: T;
  error?: { code?: number; message?: string } | null;
  id?: string | number | null;
};

type VerboseRawTransaction = {
  txid?: string;
  confirmations?: number;
  blockhash?: string;
};

function basicAuth(user?: string, password?: string): string | undefined {
  if (!user && !password) return undefined;
  return `Basic ${Buffer.from(`${user ?? ''}:${password ?? ''}`).toString('base64')}`;
}

export async function verifyTransaction(params: {
  txid: string;
  rpcUrl: string;
  rpcUser?: string;
  rpcPassword?: string;
  timeoutMs: number;
  recipient: string;
  amountZec: string;
  requiredConfirmations: number;
}): Promise<TransactionVerification> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), params.timeoutMs);

  try {
    const authorization = basicAuth(params.rpcUser, params.rpcPassword);

    const response = await fetch(params.rpcUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        ...(authorization ? { authorization } : {}),
      },
      body: JSON.stringify({
        jsonrpc: '1.0',
        id: 'zec-mint-poc',
        method: 'getrawtransaction',
        params: [params.txid, 1],
      }),
    });

    if (!response.ok) {
      return {
        txid: params.txid,
        state: 'RPC_ERROR',
        confirmations: 0,
        requiredConfirmations: params.requiredConfirmations,
        blockHash: null,
        error: `RPC HTTP ${response.status}`,
      };
    }

    const payload = (await response.json()) as RpcResponse<
      VerboseRawTransaction & {
        vout?: Array<{ value?: number; scriptPubKey?: { addresses?: string[] } }>;
        vjoinsplit?: unknown[];
        vShieldedSpend?: unknown[];
        vShieldedOutput?: unknown[];
        orchard?: unknown[];
      }
    >;

    if (payload.error) {
      if (payload.error.code === -5) {
        return {
          txid: params.txid,
          state: 'NOT_FOUND',
          confirmations: 0,
          requiredConfirmations: params.requiredConfirmations,
          blockHash: null,
        };
      }

      return {
        txid: params.txid,
        state: 'RPC_ERROR',
        confirmations: 0,
        requiredConfirmations: params.requiredConfirmations,
        blockHash: null,
        error: payload.error.message || 'Zcash RPC returned an error',
      };
    }

    const tx = payload.result;
    if (!tx) {
      return {
        txid: params.txid,
        state: 'NOT_FOUND',
        confirmations: 0,
        requiredConfirmations: params.requiredConfirmations,
        blockHash: null,
      };
    }

    const confirmations = Math.max(0, Number(tx.confirmations ?? 0));
    const expectedAmount = toZatoshi(params.amountZec);

    // Check transparent outputs for a matching recipient and amount.
    let transparentMatch = false;
    for (const vout of tx.vout ?? []) {
      const addresses = vout.scriptPubKey?.addresses ?? [];
      const value = Number(vout.value ?? 0);
      if (addresses.includes(params.recipient) && toZatoshi(String(value)) === expectedAmount) {
        transparentMatch = true;
        break;
      }
    }

    // Detect shielded components. Shielded outputs are encrypted and cannot be
    // read directly from getrawtransaction, so we cannot prove recipient/amount
    // for shielded payments via this RPC method alone.
    const hasShielded = !!(
      tx.vjoinsplit?.length ||
      tx.vShieldedSpend?.length ||
      tx.vShieldedOutput?.length ||
      tx.orchard?.length
    );

    if (
      !transparentMatch &&
      (hasShielded || params.recipient.startsWith('u') || params.recipient.startsWith('z'))
    ) {
      return {
        txid: params.txid,
        state: 'INSUFFICIENT_PROOF',
        confirmations,
        requiredConfirmations: params.requiredConfirmations,
        blockHash: tx.blockhash ?? null,
        error:
          'Transaction contains shielded outputs. RPC cannot verify the shielded recipient or amount. ' +
          'A Zcash light client/indexer is required for shielded payment proof.',
      };
    }

    if (!transparentMatch) {
      return {
        txid: params.txid,
        state: 'RPC_ERROR',
        confirmations,
        requiredConfirmations: params.requiredConfirmations,
        blockHash: tx.blockhash ?? null,
        error: `Transaction does not contain a matching transparent output to ${params.recipient} for ${params.amountZec} ZEC.`,
      };
    }

    const state = confirmations >= params.requiredConfirmations ? 'CONFIRMED' : 'CONFIRMING';

    return {
      txid: params.txid,
      state,
      confirmations,
      requiredConfirmations: params.requiredConfirmations,
      blockHash: tx.blockhash ?? null,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === 'AbortError'
          ? 'Zcash RPC request timed out'
          : error.message
        : 'Unknown Zcash RPC error';

    return {
      txid: params.txid,
      state: 'RPC_ERROR',
      confirmations: 0,
      requiredConfirmations: params.requiredConfirmations,
      blockHash: null,
      error: message,
    };
  } finally {
    clearTimeout(timeout);
  }
}
