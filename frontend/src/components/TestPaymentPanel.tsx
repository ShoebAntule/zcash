import { useZecPaymentPoc } from '../hooks/useZecPaymentPoc';
import { shortenAddress } from '../utils/address';
import { TransactionStatus } from './TransactionStatus';

export function TestPaymentPanel({ walletConnected }: { walletConnected: boolean }) {
  const payment = useZecPaymentPoc();

  return (
    <section className="stack">
      <hr />
      <header>
        <p className="label">PART 4 · ZEC payment POC · TEST FUNDS ONLY</p>
        <h2>Test ZEC payment</h2>
        <p>
          The recipient and amount come from the backend. This page never asks for or receives a
          recovery phrase, private key, or spending key.
        </p>
      </header>

      {payment.config && (
        <div className="grid">
          <span className="label">Network</span>
          <span>{payment.config.network}</span>

          <span className="label">Recipient</span>
          <span>
            <code title={payment.config.recipient}>
              {shortenAddress(payment.config.recipient, 14, 10)}
            </code>
          </span>

          <span className="label">Amount</span>
          <span>{payment.config.amountZec} ZEC</span>

          <span className="label">Funding source</span>
          <span>{payment.config.fundingSource}</span>

          <span className="label">Confirmation policy</span>
          <span>{payment.config.requiredConfirmations} confirmation(s)</span>
        </div>
      )}

      {payment.error && <div className="error">{payment.error}</div>}

      <TransactionStatus status={payment.status} verification={payment.verification} />

      {payment.txid && (
        <div className="account-card">
          <strong>Submitted txid</strong>
          <div className="value">
            <code>{payment.txid}</code>
          </div>
          {payment.verification?.blockHash && (
            <>
              <strong>Block hash</strong>
              <div className="value">
                <code>{payment.verification.blockHash}</code>
              </div>
            </>
          )}
        </div>
      )}

      <div className="actions">
        <button
          className="primary"
          type="button"
          disabled={!walletConnected || !payment.canSend}
          onClick={() => void payment.send()}
        >
          Send test ZEC
        </button>

        {payment.txid && payment.status !== 'CONFIRMED' && (
          <button
            className="secondary"
            type="button"
            onClick={() => void payment.retryWithoutPayingAgain()}
          >
            Retry verification — do not resend
          </button>
        )}

        {payment.status === 'CONFIRMED' && (
          <button className="secondary" type="button" onClick={payment.clearCompletedPoc}>
            Clear completed POC
          </button>
        )}
      </div>

      {!walletConnected && (
        <p className="label">Connect Noir first. Sending remains disabled while disconnected.</p>
      )}

      <div className="notice">
        <strong>Private-key boundary:</strong> the browser calls Noir's transaction API with public
        recipient/amount data and receives a transaction ID after approval/broadcast. Signing stays
        inside Noir. The backend receives only the txid for independent existence/confirmation
        checks.
      </div>
    </section>
  );
}
