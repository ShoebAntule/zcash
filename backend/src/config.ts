function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function positiveNumber(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return value;
}

function validatePaymentAddress(network: string, address: string): void {
  const normalizedNetwork = network.toLowerCase();
  const lowerAddress = address.toLowerCase();

  if (normalizedNetwork === 'testnet') {
    // Unified addresses on testnet use HRP "utest" or abbreviated "ut".
    // Mainnet unified addresses use HRP "u" and start with "u1".
    if (
      lowerAddress.startsWith('u1') &&
      !lowerAddress.startsWith('utest1') &&
      !lowerAddress.startsWith('ut1')
    ) {
      throw new Error(
        `MINT_PAYMENT_ADDRESS appears to be a mainnet unified address (starts with "u1") but ZCASH_NETWORK is "${network}". ` +
          `Use a testnet unified address starting with "utest1" or "ut1".`,
      );
    }

    // Mainnet transparent P2PKH addresses start with "t1".
    if (lowerAddress.startsWith('t1')) {
      throw new Error(
        `MINT_PAYMENT_ADDRESS appears to be a mainnet transparent address (starts with "t1") but ZCASH_NETWORK is "${network}".`,
      );
    }

    // Mainnet Sprout shielded addresses start with "zc".
    if (lowerAddress.startsWith('zc')) {
      throw new Error(
        `MINT_PAYMENT_ADDRESS appears to be a mainnet Sprout address (starts with "zc") but ZCASH_NETWORK is "${network}".`,
      );
    }
  }

  if (normalizedNetwork === 'mainnet') {
    // Testnet unified addresses start with "utest1" or "ut1".
    if (lowerAddress.startsWith('utest1') || lowerAddress.startsWith('ut1')) {
      throw new Error(
        `MINT_PAYMENT_ADDRESS appears to be a testnet unified address but ZCASH_NETWORK is "${network}".`,
      );
    }

    // Testnet transparent P2PKH addresses start with "tm".
    if (lowerAddress.startsWith('tm')) {
      throw new Error(
        `MINT_PAYMENT_ADDRESS appears to be a testnet transparent address but ZCASH_NETWORK is "${network}".`,
      );
    }

    // Testnet Sprout shielded addresses start with "zt".
    if (lowerAddress.startsWith('zt')) {
      throw new Error(
        `MINT_PAYMENT_ADDRESS appears to be a testnet Sprout address but ZCASH_NETWORK is "${network}".`,
      );
    }
  }
}

export interface AppConfig {
  port: number;
  frontendOrigin: string;
  pocOnly: boolean;
  zcashNetwork: string;
  paymentAddress: string;
  paymentAmountZec: string;
  requiredConfirmations: number;
  rpcUrl?: string;
  rpcUser?: string;
  rpcPassword?: string;
  rpcTimeoutMs: number;
  zsaProvider: 'disabled' | 'tx-tool' | 'zkool-graphql';
}

export function loadConfig(): AppConfig {
  const pocOnly = (process.env.POC_ONLY ?? 'true').toLowerCase() === 'true';
  const zcashNetwork = (process.env.ZCASH_NETWORK ?? 'testnet').trim();

  if (pocOnly && zcashNetwork.toLowerCase() === 'mainnet') {
    throw new Error('Part 4 POC refuses ZCASH_NETWORK=mainnet while POC_ONLY=true');
  }

  const paymentAmountZec = required('POC_PAYMENT_AMOUNT_ZEC');

  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,8})?$/.test(paymentAmountZec)) {
    throw new Error('POC_PAYMENT_AMOUNT_ZEC must be a decimal ZEC string with at most 8 decimals');
  }

  const paymentAddress = process.env.MINT_PAYMENT_ADDRESS?.trim() || '';
  if (paymentAddress) validatePaymentAddress(zcashNetwork, paymentAddress);
  if (zcashNetwork !== 'testnet')
    throw new Error(
      'This development release supports testnet only. Mainnet readiness is not proven.',
    );

  const zsaProviderRaw = (process.env.ZSA_PROVIDER ?? 'disabled').trim().toLowerCase();
  const zsaProvider: AppConfig['zsaProvider'] =
    zsaProviderRaw === 'tx-tool' || zsaProviderRaw === 'zkool-graphql'
      ? zsaProviderRaw
      : 'disabled';

  return {
    port: positiveInteger('PORT', 3001),
    frontendOrigin: process.env.FRONTEND_ORIGIN?.trim() || 'http://localhost:5173',
    pocOnly,
    zcashNetwork,
    paymentAddress,
    paymentAmountZec,
    requiredConfirmations: positiveInteger('POC_REQUIRED_CONFIRMATIONS', 1),
    rpcUrl: process.env.ZCASH_RPC_URL?.trim() || undefined,
    rpcUser: process.env.ZCASH_RPC_USER?.trim() || undefined,
    rpcPassword: process.env.ZCASH_RPC_PASSWORD?.trim() || undefined,
    rpcTimeoutMs: positiveNumber('ZCASH_RPC_TIMEOUT_MS', 8000),
    zsaProvider,
  };
}
