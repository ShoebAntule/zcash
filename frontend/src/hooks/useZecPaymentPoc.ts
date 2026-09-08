import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchPaymentConfig,
  verifyPaymentTx,
  type PaymentConfig,
  type TransactionVerification,
} from '../services/api';
import { sendShieldedZec } from '../services/noir';
import { classifyWalletError, errorMessage } from '../utils/errors';

export type PaymentPocStatus =
  | 'LOADING_CONFIG'
  | 'READY'
  | 'REQUESTING'
  | 'APPROVAL'
  | 'SUBMITTED'
  | 'CONFIRMING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'USER_REJECTED'
  | 'INSUFFICIENT_FUNDS'
  | 'NETWORK_ERROR';

const STORAGE_KEY = 'zec-mint:poc-payment';

type PersistedPayment = {
  txid: string;
  submittedAt: string;
};

function readPersisted(): PersistedPayment | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedPayment) : null;
  } catch {
    return null;
  }
}

function persistTxid(txid: string) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      txid,
      submittedAt: new Date().toISOString(),
    } satisfies PersistedPayment),
  );
}

export function useZecPaymentPoc() {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [status, setStatus] = useState<PaymentPocStatus>('LOADING_CONFIG');
  const [txid, setTxid] = useState<string | null>(() => readPersisted()?.txid ?? null);
  const [verification, setVerification] = useState<TransactionVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const inFlight = useRef(false);

  const loadConfig = useCallback(async () => {
    const controller = new AbortController();

    try {
      const next = await fetchPaymentConfig(controller.signal);
      if (!mounted.current) return;

      setConfig(next);
      setError(null);

      // A persisted txid wins over READY. This is the key duplicate-payment
      // protection for refresh/network-recovery in the POC.
      setStatus((current) => {
        if (txid) return current === 'CONFIRMED' ? 'CONFIRMED' : 'SUBMITTED';
        return 'READY';
      });
    } catch (e) {
      if (!mounted.current) return;
      setStatus('NETWORK_ERROR');
      setError(errorMessage(e));
    }

    return () => controller.abort();
  }, [txid]);

  const verify = useCallback(async () => {
    if (!txid || inFlight.current) return;

    inFlight.current = true;
    setError(null);

    try {
      const result = await verifyPaymentTx(txid);
      if (!mounted.current) return;

      setVerification(result);

      if (result.state === 'CONFIRMED') {
        setStatus('CONFIRMED');
      } else if (result.state === 'CONFIRMING' || result.state === 'NOT_FOUND') {
        // NOT_FOUND shortly after broadcast is not treated as terminal failure.
        setStatus('CONFIRMING');
      } else {
        setStatus('NETWORK_ERROR');
        setError(result.error || 'Trusted Zcash verification is temporarily unavailable.');
      }
    } catch (e) {
      if (!mounted.current) return;
      setStatus('NETWORK_ERROR');
      setError(errorMessage(e));
    } finally {
      inFlight.current = false;
    }
  }, [txid]);

  const send = useCallback(async () => {
    if (!config || txid || inFlight.current) return;

    inFlight.current = true;
    setError(null);
    setVerification(null);
    setStatus('REQUESTING');

    try {
      // REQUESTING exists before the SDK call; the call itself opens Noir's
      // approval UI, so while awaiting its promise the UI is in APPROVAL.
      setStatus('APPROVAL');

      const submittedTxid = await sendShieldedZec({
        to: config.recipient,
        amount: config.amountZec,
      });

      if (!mounted.current) return;

      persistTxid(submittedTxid);
      setTxid(submittedTxid);
      setStatus('SUBMITTED');
    } catch (e) {
      if (!mounted.current) return;

      const kind = classifyWalletError(e);
      const message = errorMessage(e).toLowerCase();

      if (kind === 'USER_REJECTED') {
        setStatus('USER_REJECTED');
        setError('Payment approval was rejected in Noir. No transaction was recorded by this app.');
      } else if (
        message.includes('insufficient') ||
        message.includes('not enough') ||
        message.includes('available balance') ||
        message.includes('funds')
      ) {
        setStatus('INSUFFICIENT_FUNDS');
        setError('Noir reports insufficient available ZEC for this test payment and its fee.');
      } else {
        setStatus('FAILED');
        setError(errorMessage(e));
      }
    } finally {
      inFlight.current = false;
    }
  }, [config, txid]);

  const retryWithoutPayingAgain = useCallback(async () => {
    if (!txid) {
      await loadConfig();
      return;
    }
    await verify();
  }, [loadConfig, txid, verify]);

  const clearCompletedPoc = useCallback(() => {
    // Deliberately only enabled by the UI after CONFIRMED. We do not expose a
    // "clear pending tx" button because doing so could encourage a duplicate
    // payment while the first tx is merely unobserved.
    if (status !== 'CONFIRMED') return;
    localStorage.removeItem(STORAGE_KEY);
    setTxid(null);
    setVerification(null);
    setError(null);
    setStatus('READY');
  }, [status]);

  useEffect(() => {
    mounted.current = true;
    void loadConfig();
    return () => {
      mounted.current = false;
    };
  }, [loadConfig]);

  useEffect(() => {
    if (!txid) return;
    if (!['SUBMITTED', 'CONFIRMING', 'NETWORK_ERROR'].includes(status)) return;

    void verify();

    const interval = window.setInterval(() => {
      void verify();
    }, 10_000);

    return () => window.clearInterval(interval);
  }, [status, txid, verify]);

  const canSend = useMemo(
    () =>
      Boolean(
        config &&
        !txid &&
        ['READY', 'USER_REJECTED', 'INSUFFICIENT_FUNDS', 'FAILED'].includes(status),
      ),
    [config, status, txid],
  );

  return {
    config,
    status,
    txid,
    verification,
    error,
    canSend,
    send,
    verify,
    retryWithoutPayingAgain,
    clearCompletedPoc,
  };
}
