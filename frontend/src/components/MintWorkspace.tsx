import { useEffect, useState } from 'react';
import type { useNoirWallet } from '../hooks/useNoirWallet';
const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
type Config = {
  name: string;
  available: number;
  minted: number;
  max_supply: number;
  max_per_tx: number;
  priceZec: string;
  previewEnabled: boolean;
  blockers: string[];
};
type Order = { id: string; status: string; totalZec: string; expiresAt: string };
type Recovery = { requestId: string; accessToken: string; quantity: number };
async function json(path: string, options: RequestInit = {}) {
  const r = await fetch(base + path, options);
  const p = await r.json();
  if (!r.ok) throw new Error(p.message || p.code || 'Request failed');
  return p;
}
export function MintWorkspace({ wallet }: { wallet: ReturnType<typeof useNoirWallet> }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const refresh = () =>
    json('/api/mint/config')
      .then(setConfig)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void refresh();
  }, []);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('mint-preview-recovery');
      if (raw) {
        const c = JSON.parse(raw) as Recovery;
        void json('/api/mint/orders/' + encodeURIComponent(c.requestId), {
          headers: { Authorization: 'Bearer ' + c.accessToken },
        })
          .then(setOrder)
          .catch((e) => setError(e.message));
      }
    } catch {
      setError('Saved preview could not be restored.');
    }
  }, []);
  async function reserve() {
    setBusy(true);
    setError('');
    try {
      const raw = localStorage.getItem('mint-preview-recovery');
      const c: Recovery = raw
        ? JSON.parse(raw)
        : {
            requestId: crypto.randomUUID(),
            accessToken: Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
              b.toString(16).padStart(2, '0'),
            ).join(''),
            quantity,
          };
      // Persist before requesting so network errors can retry the SAME reservation.
      localStorage.setItem('mint-preview-recovery', JSON.stringify(c));
      setOrder(
        await json('/api/mint/preview-reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(c),
        }),
      );
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel stack" aria-label="Mint development workspace">
      <p className="label">TESTNET DEVELOPMENT · MINTING PAUSED</p>
      <h1>{config?.name || 'CHOMP Test Collection'}</h1>
      <p>
        Collection setup and inventory preview. Artwork has not been supplied. No on-chain asset is
        issued by this preview.
      </p>
      <div className="art-preview" aria-label="Artwork placeholder">
        CHOMP
        <br />
        <small>Artwork preview pending</small>
      </div>
      {config && (
        <>
          <p>
            {config.available} available · {config.minted} minted · {config.max_supply} total
          </p>
          <p>Price per item: {config.priceZec} test ZEC</p>
        </>
      )}
      <label>
        Quantity{' '}
        <input
          type="number"
          min="1"
          max={config?.max_per_tx || 5}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
      </label>
      {wallet.status !== 'CONNECTED' ? (
        <button disabled={wallet.status === 'CONNECTING'} onClick={() => void wallet.connect()}>
          Connect Noir Wallet
        </button>
      ) : (
        <>
          <p>Wallet connected</p>
          <button disabled>Mint unavailable — feasibility pending</button>
        </>
      )}
      {wallet.error && <p role="alert">{wallet.error}</p>}
      <ul>
        {config?.blockers.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      {config?.previewEnabled && (
        <>
          <button
            disabled={
              busy ||
              !!order ||
              !Number.isInteger(quantity) ||
              quantity < 1 ||
              quantity > config.max_per_tx
            }
            onClick={() => void reserve()}
          >
            {busy ? 'Reserving…' : 'Test inventory reservation (no payment)'}
          </button>
          {order && (
            <div role="status">
              <p>Preview order: {order.id}</p>
              <p>
                {order.status} · {order.totalZec} test ZEC
              </p>
              <p>Expires: {new Date(order.expiresAt).toLocaleString()}</p>
              <button
                onClick={() => {
                  localStorage.removeItem('mint-preview-recovery');
                  setOrder(null);
                }}
              >
                Start another preview
              </button>
            </div>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
      <button
        onClick={() => {
          setError('');
          void refresh();
        }}
      >
        Refresh collection
      </button>
    </section>
  );
}
