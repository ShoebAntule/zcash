import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  connectNoir,
  disconnectNoir,
  getExistingNoirConnection,
  getNoir,
  getNoirBalance,
  subscribeToNoirAccountsChanged,
  type ConnectedNoir,
  type NoirBalance,
} from '../services/noir';
import { classifyWalletError, errorMessage, type WalletErrorKind } from '../utils/errors';

export type NoirConnectionState =
  'CHECKING' | 'NOT_INSTALLED' | 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';

export interface NoirWalletState {
  status: NoirConnectionState;
  connection: ConnectedNoir | null;
  balance: NoirBalance | null;
  selectedAccountId: string | null;
  errorKind: WalletErrorKind | null;
  error: string | null;
}

const INITIAL: NoirWalletState = {
  status: 'CHECKING',
  connection: null,
  balance: null,
  selectedAccountId: null,
  errorKind: null,
  error: null,
};

export function useNoirWallet() {
  const [state, setState] = useState<NoirWalletState>(INITIAL);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    const wallet = getNoir();

    if (!wallet) {
      if (mounted.current) {
        setState({
          ...INITIAL,
          status: 'NOT_INSTALLED',
        });
      }
      return;
    }

    try {
      const connection = await getExistingNoirConnection();

      if (!connection) {
        if (mounted.current) {
          setState({
            ...INITIAL,
            status: 'DISCONNECTED',
          });
        }
        return;
      }

      const selectedAccountId = connection.accounts[0]?.id ?? null;
      const balance = await getNoirBalance(selectedAccountId ?? undefined);

      if (mounted.current) {
        setState({
          status: 'CONNECTED',
          connection,
          balance,
          selectedAccountId,
          errorKind: null,
          error: null,
        });
      }
    } catch (error) {
      if (mounted.current) {
        setState({
          ...INITIAL,
          status: 'DISCONNECTED',
          errorKind: classifyWalletError(error),
          error: errorMessage(error),
        });
      }
    }
  }, []);

  const connect = useCallback(async () => {
    if (!getNoir()) {
      setState({ ...INITIAL, status: 'NOT_INSTALLED' });
      return;
    }

    setState((current) => ({
      ...current,
      status: 'CONNECTING',
      errorKind: null,
      error: null,
    }));

    try {
      const connection = await connectNoir();
      const selectedAccountId = connection.accounts[0]?.id ?? null;
      const balance = await getNoirBalance(selectedAccountId ?? undefined);

      if (mounted.current) {
        setState({
          status: 'CONNECTED',
          connection,
          balance,
          selectedAccountId,
          errorKind: null,
          error: null,
        });
      }
    } catch (error) {
      const kind = classifyWalletError(error);

      if (mounted.current) {
        setState({
          ...INITIAL,
          status: getNoir() ? 'DISCONNECTED' : 'NOT_INSTALLED',
          errorKind: kind,
          error:
            kind === 'USER_REJECTED'
              ? 'Connection request was rejected in Noir Wallet.'
              : errorMessage(error),
        });
      }
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await disconnectNoir();
    } finally {
      if (mounted.current) {
        setState({
          ...INITIAL,
          status: getNoir() ? 'DISCONNECTED' : 'NOT_INSTALLED',
        });
      }
    }
  }, []);

  const selectAccount = useCallback(
    async (accountId: string) => {
      if (!state.connection) return;

      setState((current) => ({
        ...current,
        selectedAccountId: accountId,
        errorKind: null,
        error: null,
      }));

      try {
        const balance = await getNoirBalance(accountId);
        if (mounted.current) {
          setState((current) => ({ ...current, balance }));
        }
      } catch (error) {
        if (mounted.current) {
          setState((current) => ({
            ...current,
            errorKind: classifyWalletError(error),
            error: errorMessage(error),
          }));
        }
      }
    },
    [state.connection],
  );

  useEffect(() => {
    mounted.current = true;
    void refresh();

    return () => {
      mounted.current = false;
    };
  }, [refresh]);

  useEffect(() => {
    const unsubscribe = subscribeToNoirAccountsChanged(() => {
      void refresh();
    });

    return unsubscribe;
  }, [refresh, state.status]);

  const selectedAccount = useMemo(() => {
    if (!state.connection || !state.selectedAccountId) return null;
    return (
      state.connection.accounts.find((account) => account.id === state.selectedAccountId) ?? null
    );
  }, [state.connection, state.selectedAccountId]);

  return {
    ...state,
    selectedAccount,
    connect,
    disconnect,
    refresh,
    selectAccount,
  };
}
