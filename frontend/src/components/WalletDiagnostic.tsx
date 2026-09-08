import type { ReturnTypeUseNoirWallet } from '../types/wallet';
import { AddressCapability } from './AddressCapability';
import { WalletInstallNotice } from './WalletInstallNotice';
import { shortenAddress } from '../utils/address';

function printable(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  return JSON.stringify(value);
}

export function WalletDiagnostic({ wallet }: { wallet: ReturnTypeUseNoirWallet }) {
  const isConnected = wallet.status === 'CONNECTED' && wallet.connection;

  return (
    <div className="stack">
      <div className="row">
        <span className="status">Noir: {wallet.status}</span>
        {wallet.errorKind && <span className="status">Error: {wallet.errorKind}</span>}
      </div>

      {wallet.status === 'NOT_INSTALLED' && <WalletInstallNotice />}
      {wallet.error && <div className="error">{wallet.error}</div>}

      <div className="actions">
        {wallet.status !== 'CONNECTED' && wallet.status !== 'NOT_INSTALLED' && (
          <button
            className="primary"
            type="button"
            onClick={() => void wallet.connect()}
            disabled={wallet.status === 'CONNECTING' || wallet.status === 'CHECKING'}
          >
            {wallet.status === 'CONNECTING' ? 'Waiting for Noir…' : 'Connect Noir Wallet'}
          </button>
        )}

        <button className="secondary" type="button" onClick={() => void wallet.refresh()}>
          Refresh status
        </button>

        {wallet.status === 'CONNECTED' && (
          <button className="secondary" type="button" onClick={() => void wallet.disconnect()}>
            Disconnect
          </button>
        )}
      </div>

      {isConnected && (
        <>
          <section className="stack">
            <h2>Primary authorized addresses</h2>
            <AddressCapability
              label="Shielded"
              address={wallet.connection!.shielded}
              capability="shielded"
            />
            <AddressCapability
              label="Transparent"
              address={wallet.connection!.transparent}
              capability="transparent"
            />
          </section>

          <section className="stack">
            <h2>Authorized accounts</h2>
            {wallet.connection!.accounts.map((account) => (
              <div className="account-card" key={account.id}>
                <div className="row">
                  <strong>{account.label || 'Authorized account'}</strong>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => void wallet.selectAccount(account.id)}
                    disabled={wallet.selectedAccountId === account.id}
                  >
                    {wallet.selectedAccountId === account.id ? 'Selected' : 'Select'}
                  </button>
                </div>
                <div className="grid">
                  <span className="label">Account ID</span>
                  <span>
                    <code>{shortenAddress(account.id, 12, 8)}</code>
                  </span>
                  <span className="label">Shielded</span>
                  <span>
                    <code title={account.addresses.shielded}>
                      {shortenAddress(account.addresses.shielded)}
                    </code>
                  </span>
                  <span className="label">Transparent</span>
                  <span>
                    <code title={account.addresses.transparent}>
                      {shortenAddress(account.addresses.transparent)}
                    </code>
                  </span>
                </div>
              </div>
            ))}
          </section>

          <section>
            <h2>Selected-account balance</h2>
            <div className="grid">
              <span className="label">Available</span>
              <span>{printable(wallet.balance?.available)} ZEC</span>
              <span className="label">Shielded</span>
              <span>{printable(wallet.balance?.shielded)} ZEC</span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
