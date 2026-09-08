import type { PaymentPocStatus } from '../hooks/useZecPaymentPoc';
import type { TransactionVerification } from '../services/api';

const LABELS: Record<PaymentPocStatus, string> = {
  LOADING_CONFIG: 'Loading payment configuration',
  READY: 'Ready',
  REQUESTING: 'Preparing request',
  APPROVAL: 'Waiting for Noir approval',
  SUBMITTED: 'Submitted',
  CONFIRMING: 'Confirming independently',
  CONFIRMED: 'Confirmed',
  FAILED: 'Failed before confirmed submission',
  USER_REJECTED: 'User rejected',
  INSUFFICIENT_FUNDS: 'Insufficient funds',
  NETWORK_ERROR: 'Verification network error',
};

export function TransactionStatus({
  status,
  verification,
}: {
  status: PaymentPocStatus;
  verification: TransactionVerification | null;
}) {
  return (
    <section className="stack">
      <h2>Transaction status</h2>
      <div className="row">
        <span className="status">{LABELS[status]}</span>
        {verification && (
          <span className="status">
            Confirmations: {verification.confirmations}/{verification.requiredConfirmations}
          </span>
        )}
      </div>

      {status === 'APPROVAL' && (
        <div className="notice">
          Review the <strong>recipient</strong>, <strong>amount</strong>,{' '}
          <strong>funding source</strong>, <strong>network</strong>, and wallet fee inside Noir
          before approving.
        </div>
      )}

      {status === 'NETWORK_ERROR' && (
        <div className="notice">
          The app already has a transaction ID or cannot reach trusted verification.{' '}
          <strong>Do not send another payment.</strong> Retry verification instead.
        </div>
      )}

      {status === 'CONFIRMING' && (
        <div className="notice">
          The transaction is being checked independently. A temporarily unobserved transaction is
          not treated as a failed payment.
        </div>
      )}
    </section>
  );
}
