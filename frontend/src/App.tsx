import { TestPaymentPanel } from './components/TestPaymentPanel';
import { WalletDiagnostic } from './components/WalletDiagnostic';
import { useNoirWallet } from './hooks/useNoirWallet';
import { MintWorkspace } from './components/MintWorkspace';
import { ZsaPanel } from './components/ZsaPanel';

export default function App() {
  const wallet = useNoirWallet();

  return (
    <main className="shell">
      <MintWorkspace wallet={wallet} />
      <ZsaPanel />
      <div className="panel stack">
        <header>
          <p className="label">ZEC Mint · Noir + ZEC proof-of-concept</p>
          <h1>Noir Wallet + test ZEC payment</h1>
          <p>
            Part 3 proves wallet access. Part 4 adds a tiny testnet ZEC payment, persistent txid,
            independent RPC verification, confirmation tracking, and safe recovery.
          </p>
        </header>

        <WalletDiagnostic wallet={wallet} />

        {import.meta.env.VITE_ENABLE_PAYMENT_POC === 'true' ? (
          <TestPaymentPanel walletConnected={wallet.status === 'CONNECTED'} />
        ) : (
          <p>
            Payment diagnostic disabled. Enable only for a controlled, funded testnet transfer; it
            does not mint an asset.
          </p>
        )}
      </div>
    </main>
  );
}
