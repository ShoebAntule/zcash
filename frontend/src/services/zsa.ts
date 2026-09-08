const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface ZsaStatus {
  provider: string;
  network: string;
  noirZsaSupport: boolean;
  message: string;
  endpoints: {
    issue: boolean | string;
    transfer: boolean | string;
  };
}

export async function fetchZsaStatus(signal?: AbortSignal): Promise<ZsaStatus> {
  const response = await fetch(`${API_BASE_URL}/api/zsa/status`, { signal });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(payload.message || `ZSA status request failed (${response.status})`);
  }
  return response.json() as Promise<ZsaStatus>;
}

export interface IssueAssetRequest {
  assetIdentifier: string;
}

export interface ZsaIssueResponse {
  id: string;
  assetIdentifier: string;
  issuanceTxid: string | null;
  provider: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function issueAsset(
  input: IssueAssetRequest,
  signal?: AbortSignal,
): Promise<ZsaIssueResponse> {
  const response = await fetch(`${API_BASE_URL}/api/zsa/issue`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    signal,
    body: JSON.stringify(input),
  });
  const payload = (await response.json().catch(() => ({}))) as ZsaIssueResponse & {
    message?: string;
    code?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || `Issue asset failed (${response.status})`);
  }
  return payload as ZsaIssueResponse;
}

export interface TransferAssetRequest {
  assetIdentifier: string;
  recipientAddress: string;
}

export interface ZsaTransferResponse {
  id: string;
  assetIdentifier: string;
  transferTxid: string | null;
  provider: string;
  status: string;
  recipientAddress: string | null;
  createdAt?: string;
  updatedAt?: string;
  idempotent?: boolean;
}

export async function transferAsset(
  input: TransferAssetRequest,
  idempotencyKey?: string,
  signal?: AbortSignal,
): Promise<ZsaTransferResponse> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (idempotencyKey) {
    headers['idempotency-key'] = idempotencyKey;
  }
  const response = await fetch(`${API_BASE_URL}/api/zsa/transfer`, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify(input),
  });
  const payload = (await response.json().catch(() => ({}))) as ZsaTransferResponse & {
    message?: string;
    code?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || `Transfer asset failed (${response.status})`);
  }
  return payload as ZsaTransferResponse;
}

export interface ZsaTransferStatusResponse {
  id: string;
  assetIdentifier?: string;
  transferTxid?: string | null;
  provider?: string;
  status?: string;
  recipientAddress?: string | null;
  createdAt?: string;
  updatedAt?: string;
  persistedStatus?: string;
  message?: string;
  code?: string;
}

export async function getTransferStatus(
  id: string,
  signal?: AbortSignal,
): Promise<ZsaTransferStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/zsa/transfer/${encodeURIComponent(id)}`, {
    signal,
  });
  const payload = (await response.json().catch(() => ({}))) as ZsaTransferStatusResponse;
  if (!response.ok) {
    throw new Error(payload.message || `Transfer status failed (${response.status})`);
  }
  return payload;
}
