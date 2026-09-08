import { useEffect, useState } from 'react';
import {
  fetchZsaStatus,
  issueAsset,
  transferAsset,
  getTransferStatus,
  type ZsaStatus,
  type ZsaIssueResponse,
  type ZsaTransferResponse,
  type ZsaTransferStatusResponse,
} from '../services/zsa';

type OperationState = 'idle' | 'pending' | 'confirmed' | 'failed';

export function ZsaPanel() {
  const [status, setStatus] = useState<ZsaStatus | null>(null);
  const [statusError, setStatusError] = useState('');
  const [assetIdentifier, setAssetIdentifier] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [operation, setOperation] = useState<'issue' | 'transfer' | null>(null);
  const [opState, setOpState] = useState<OperationState>('idle');
  const [opResult, setOpResult] = useState<ZsaIssueResponse | ZsaTransferResponse | null>(null);
  const [opError, setOpError] = useState('');
  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState<ZsaTransferStatusResponse | null>(null);
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetchZsaStatus(controller.signal)
      .then(setStatus)
      .catch((e) => setStatusError(e instanceof Error ? e.message : 'Failed to load ZSA status'));
    return () => controller.abort();
  }, []);

  async function handleIssue() {
    setOperation('issue');
    setOpState('pending');
    setOpError('');
    setOpResult(null);
    try {
      const result = await issueAsset({ assetIdentifier: assetIdentifier.trim() });
      setOpResult(result);
      setOpState(result.status === 'CONFIRMED' ? 'confirmed' : 'pending');
    } catch (e) {
      setOpError(e instanceof Error ? e.message : 'Issue failed');
      setOpState('failed');
    }
  }

  async function handleTransfer() {
    setOperation('transfer');
    setOpState('pending');
    setOpError('');
    setOpResult(null);
    try {
      const result = await transferAsset({
        assetIdentifier: assetIdentifier.trim(),
        recipientAddress: recipientAddress.trim(),
      });
      setOpResult(result);
      setOpState(result.status === 'CONFIRMED' ? 'confirmed' : 'pending');
    } catch (e) {
      setOpError(e instanceof Error ? e.message : 'Transfer failed');
      setOpState('failed');
    }
  }

  async function handleLookup() {
    setLookupError('');
    setLookupResult(null);
    try {
      const result = await getTransferStatus(lookupId.trim());
      setLookupResult(result);
    } catch (e) {
      setLookupError(e instanceof Error ? e.message : 'Lookup failed');
    }
  }

  return (
    <section className="panel stack" aria-label="ZSA integration">
      <p className="label">ZSA EXPERIMENT · FAIL-CLOSED</p>
      <h1>Zcash Shielded Assets</h1>
      <p>
        <strong>Noir Wallet currently supports ZEC only.</strong> ZSA issuance and transfer are not
        available through the Noir Wallet SDK. This panel shows backend ZSA integration boundaries
        only.
      </p>

      {statusError && (
        <p role="alert" className="error">
          {statusError}
        </p>
      )}

      {status && (
        <div role="status" className="status-box">
          <p>
            <strong>Provider:</strong> {status.provider}
          </p>
          <p>
            <strong>Network:</strong> {status.network}
          </p>
          <p>
            <strong>Noir ZSA support:</strong> {status.noirZsaSupport ? 'Yes' : 'No'}
          </p>
          <p>{status.message}</p>
          {status.provider === 'disabled' && (
            <p className="error">
              ZSA provider is disabled. Set <code>ZSA_PROVIDER</code> to a configured adapter to
              enable experimental endpoints.
            </p>
          )}
          {status.provider !== 'disabled' && (
            <p className="warning">
              Provider adapter is present but not yet verified. Do not treat any response as a real
              on-chain issuance or transfer.
            </p>
          )}
        </div>
      )}

      <div className="stack">
        <h2>Issue asset (experimental)</h2>
        <label>
          Asset identifier (64-char hex)
          <input
            value={assetIdentifier}
            onChange={(e) => setAssetIdentifier(e.target.value)}
            placeholder="0000000000000000000000000000000000000000000000000000000000000000"
          />
        </label>
        <button
          disabled={!assetIdentifier || operation === 'issue'}
          onClick={() => void handleIssue()}
        >
          Issue asset
        </button>
      </div>

      <div className="stack">
        <h2>Transfer asset (experimental)</h2>
        <label>
          Recipient address
          <input
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="uregtest1... or utest1..."
          />
        </label>
        <button
          disabled={!assetIdentifier || !recipientAddress || operation === 'transfer'}
          onClick={() => void handleTransfer()}
        >
          Transfer asset
        </button>
      </div>

      <div className="stack">
        <h2>Transfer lookup</h2>
        <label>
          Transfer ID
          <input
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder="UUID or provider-specific id"
          />
        </label>
        <button disabled={!lookupId} onClick={() => void handleLookup()}>
          Lookup transfer
        </button>
      </div>

      {opState !== 'idle' && (
        <div role="status" className="status-box">
          <p>
            <strong>Operation:</strong> {operation ?? 'unknown'}
          </p>
          <p>
            <strong>State:</strong> {opState}
          </p>
          {opResult && <pre>{JSON.stringify(opResult, null, 2)}</pre>}
          {opError && <p className="error">{opError}</p>}
          {opState === 'pending' && (
            <p className="warning">
              Pending does not mean confirmed. A real provider response with an on-chain txid is
              required before reporting success.
            </p>
          )}
        </div>
      )}

      {lookupResult && (
        <div role="status" className="status-box">
          <pre>{JSON.stringify(lookupResult, null, 2)}</pre>
        </div>
      )}
      {lookupError && (
        <p role="alert" className="error">
          {lookupError}
        </p>
      )}
    </section>
  );
}
