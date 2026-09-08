import { getNoirWallet } from '@noir-wallet/sdk';

export type NoirWallet = NonNullable<ReturnType<typeof getNoirWallet>>;
export type NoirConnection = Awaited<ReturnType<NoirWallet['zcash']['getAccounts']>>;
export type ConnectedNoir = Exclude<NoirConnection, null>;
export type NoirAuthorizedAccount = ConnectedNoir['accounts'][number];
export type NoirBalance = Awaited<ReturnType<NoirWallet['zcash']['getBalance']>>;

export function getNoir(): NoirWallet | null {
  if (typeof window === 'undefined') return null;
  return getNoirWallet() ?? null;
}

export function isNoirInstalled(): boolean {
  return getNoir() !== null;
}

export async function getExistingNoirConnection(): Promise<ConnectedNoir | null> {
  const wallet = getNoir();
  if (!wallet) return null;
  return (await wallet.zcash.getAccounts()) ?? null;
}

export async function connectNoir(): Promise<ConnectedNoir> {
  const wallet = getNoir();
  if (!wallet) throw new Error('Noir Wallet is not installed.');
  return wallet.zcash.connect();
}

export async function getNoirBalance(accountId?: string): Promise<NoirBalance> {
  const wallet = getNoir();
  if (!wallet) throw new Error('Noir Wallet is not installed.');
  return accountId ? wallet.zcash.getBalance(accountId) : wallet.zcash.getBalance();
}

export async function sendShieldedZec(params: { to: string; amount: string }): Promise<string> {
  const wallet = getNoir();
  if (!wallet) throw new Error('Noir Wallet is not installed.');

  // Current Noir SDK contract: destination is `to`; ZEC amount is a decimal
  // string; every send requires a separate approval inside the extension.
  return wallet.zcash.sendTransaction({
    to: params.to,
    amount: params.amount,
    fundingSource: 'shielded',
  });
}

export async function disconnectNoir(): Promise<void> {
  const wallet = getNoir();
  if (!wallet) return;
  await wallet.zcash.disconnect();
}

export function subscribeToNoirAccountsChanged(callback: () => void): () => void {
  const wallet = getNoir();
  if (!wallet) return () => {};

  const handler = () => void callback();
  wallet.zcash.on('accountsChanged', handler);

  return () => {
    wallet.zcash.removeListener('accountsChanged', handler);
  };
}
