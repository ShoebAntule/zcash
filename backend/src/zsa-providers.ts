import type {
  ZsaService,
  ZsaProviderResult,
  IssueAssetInput,
  TransferAssetInput,
  ZsaAsset,
  ZsaTransfer,
} from './zsa.js';

export class DisabledZsaProvider implements ZsaService {
  async issueAsset(_input: IssueAssetInput): Promise<ZsaProviderResult<ZsaAsset>> {
    return {
      ok: false,
      error: 'ZSA provider is disabled. Set ZSA_PROVIDER to a configured adapter.',
      code: 'ZSA_PROVIDER_NOT_CONFIGURED',
    };
  }

  async transferAsset(_input: TransferAssetInput): Promise<ZsaProviderResult<ZsaTransfer>> {
    return {
      ok: false,
      error: 'ZSA provider is disabled. Set ZSA_PROVIDER to a configured adapter.',
      code: 'ZSA_PROVIDER_NOT_CONFIGURED',
    };
  }

  async getAssetStatus(_assetIdentifier: string): Promise<ZsaProviderResult<ZsaAsset>> {
    return {
      ok: false,
      error: 'ZSA provider is disabled. Set ZSA_PROVIDER to a configured adapter.',
      code: 'ZSA_PROVIDER_NOT_CONFIGURED',
    };
  }

  async getRecipientHolding(
    _assetIdentifier: string,
    _recipientAddress: string,
  ): Promise<ZsaProviderResult<ZsaTransfer | null>> {
    return {
      ok: false,
      error: 'ZSA provider is disabled. Set ZSA_PROVIDER to a configured adapter.',
      code: 'ZSA_PROVIDER_NOT_CONFIGURED',
    };
  }

  async verifyTransfer(_transferId: string): Promise<ZsaProviderResult<ZsaTransfer>> {
    return {
      ok: false,
      error: 'ZSA provider is disabled. Set ZSA_PROVIDER to a configured adapter.',
      code: 'ZSA_PROVIDER_NOT_CONFIGURED',
    };
  }
}

export class TxToolZsaProvider implements ZsaService {
  async issueAsset(_input: IssueAssetInput): Promise<ZsaProviderResult<ZsaAsset>> {
    return {
      ok: false,
      error:
        'zcash_tx_tool ZSA adapter is not yet verified. Integration boundary is implemented but transfer command and wallet integration are unconfirmed.',
      code: 'ZSA_TRANSFER_UNAVAILABLE',
    };
  }

  async transferAsset(_input: TransferAssetInput): Promise<ZsaProviderResult<ZsaTransfer>> {
    return {
      ok: false,
      error:
        'zcash_tx_tool ZSA adapter is not yet verified. Integration boundary is implemented but transfer command and wallet integration are unconfirmed.',
      code: 'ZSA_TRANSFER_UNAVAILABLE',
    };
  }

  async getAssetStatus(_assetIdentifier: string): Promise<ZsaProviderResult<ZsaAsset>> {
    return {
      ok: false,
      error:
        'zcash_tx_tool ZSA adapter is not yet verified. Integration boundary is implemented but transfer command and wallet integration are unconfirmed.',
      code: 'ZSA_TRANSFER_UNAVAILABLE',
    };
  }

  async getRecipientHolding(
    _assetIdentifier: string,
    _recipientAddress: string,
  ): Promise<ZsaProviderResult<ZsaTransfer | null>> {
    return {
      ok: false,
      error:
        'zcash_tx_tool ZSA adapter is not yet verified. Integration boundary is implemented but transfer command and wallet integration are unconfirmed.',
      code: 'ZSA_TRANSFER_UNAVAILABLE',
    };
  }

  async verifyTransfer(_transferId: string): Promise<ZsaProviderResult<ZsaTransfer>> {
    return {
      ok: false,
      error:
        'zcash_tx_tool ZSA adapter is not yet verified. Integration boundary is implemented but transfer command and wallet integration are unconfirmed.',
      code: 'ZSA_TRANSFER_UNAVAILABLE',
    };
  }
}

export class ZkoolGraphqlZsaProvider implements ZsaService {
  async issueAsset(_input: IssueAssetInput): Promise<ZsaProviderResult<ZsaAsset>> {
    return {
      ok: false,
      error:
        'zkool-graphql adapter is not yet implemented. Real provider configuration still required.',
      code: 'ZSA_TRANSFER_UNAVAILABLE',
    };
  }

  async transferAsset(_input: TransferAssetInput): Promise<ZsaProviderResult<ZsaTransfer>> {
    return {
      ok: false,
      error:
        'zkool-graphql adapter is not yet implemented. Real provider configuration still required.',
      code: 'ZSA_TRANSFER_UNAVAILABLE',
    };
  }

  async getAssetStatus(_assetIdentifier: string): Promise<ZsaProviderResult<ZsaAsset>> {
    return {
      ok: false,
      error:
        'zkool-graphql adapter is not yet implemented. Real provider configuration still required.',
      code: 'ZSA_TRANSFER_UNAVAILABLE',
    };
  }

  async getRecipientHolding(
    _assetIdentifier: string,
    _recipientAddress: string,
  ): Promise<ZsaProviderResult<ZsaTransfer | null>> {
    return {
      ok: false,
      error:
        'zkool-graphql adapter is not yet implemented. Real provider configuration still required.',
      code: 'ZSA_TRANSFER_UNAVAILABLE',
    };
  }

  async verifyTransfer(_transferId: string): Promise<ZsaProviderResult<ZsaTransfer>> {
    return {
      ok: false,
      error:
        'zkool-graphql adapter is not yet implemented. Real provider configuration still required.',
      code: 'ZSA_TRANSFER_UNAVAILABLE',
    };
  }
}

export function createZsaProvider(provider: string): ZsaService {
  switch (provider) {
    case 'tx-tool':
      return new TxToolZsaProvider();
    case 'zkool-graphql':
      return new ZkoolGraphqlZsaProvider();
    case 'disabled':
    default:
      return new DisabledZsaProvider();
  }
}
