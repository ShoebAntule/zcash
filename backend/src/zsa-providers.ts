import type {
  ZsaService,
  ZsaProviderResult,
  IssueAssetInput,
  TransferAssetInput,
  ZsaAsset,
  ZsaTransfer,
  DryRunTransferInput,
  DryRunResult,
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

  async dryRunTransfer(_input: DryRunTransferInput): Promise<ZsaProviderResult<DryRunResult>> {
    return {
      ok: false,
      error: 'ZSA provider is disabled. Set ZSA_PROVIDER to zkool-graphql to generate a dry-run.',
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

  async dryRunTransfer(_input: DryRunTransferInput): Promise<ZsaProviderResult<DryRunResult>> {
    return {
      ok: false,
      error:
        'zcash_tx_tool has no standalone transfer subcommand. Test scenarios only create isolated internal wallets and assets.',
      code: 'ZSA_TRANSFER_UNAVAILABLE',
    };
  }
}

export class ZkoolGraphqlZsaProvider implements ZsaService {
  private readonly endpoint: string;

  constructor(endpoint = 'http://localhost:8000/graphql') {
    this.endpoint = endpoint;
  }

  async issueAsset(_input: IssueAssetInput): Promise<ZsaProviderResult<ZsaAsset>> {
    return {
      ok: false,
      error:
        'zkool-graphql adapter requires a verified issuance flow. Use zkool GUI or documented GraphQL mutation only.',
      code: 'ZSA_TRANSFER_UNAVAILABLE',
    };
  }

  async transferAsset(_input: TransferAssetInput): Promise<ZsaProviderResult<ZsaTransfer>> {
    return {
      ok: false,
      error:
        'zkool-graphql adapter requires manual JWT authentication and database password. Use dryRunTransfer to generate the mutation.',
      code: 'ZSA_TRANSFER_UNAVAILABLE',
    };
  }

  async getAssetStatus(assetIdentifier: string): Promise<ZsaProviderResult<ZsaAsset>> {
    return {
      ok: false,
      error: `Use the GraphQL query assets(id_account: <issuer_id>) to verify holding of "${assetIdentifier}" in zkool's assets table.`,
      code: 'ZSA_TRANSFER_UNAVAILABLE',
    };
  }

  async getRecipientHolding(
    assetIdentifier: string,
    _recipientAddress: string,
  ): Promise<ZsaProviderResult<ZsaTransfer | null>> {
    return {
      ok: false,
      error: `Use the GraphQL query assets(id_account: <recipient_id>) to verify holding of "${assetIdentifier}".`,
      code: 'ZSA_TRANSFER_UNAVAILABLE',
    };
  }

  async verifyTransfer(transferId: string): Promise<ZsaProviderResult<ZsaTransfer>> {
    return {
      ok: false,
      error: `Use the GraphQL query transaction(id: <id>, txid: "${transferId}") to verify on-chain confirmation.`,
      code: 'ZSA_TRANSFER_UNAVAILABLE',
    };
  }

  async dryRunTransfer(input: DryRunTransferInput): Promise<ZsaProviderResult<DryRunResult>> {
    const mutation =
      'mutation TransferAsset($id_account: Int!, $payment: Payment!) { pay(id_account: $id_account, payment: $payment) }';
    const variables = {
      id_account: 1,
      payment: {
        recipients: [
          {
            address: input.recipientAddress,
            amount: input.amount.toString(),
            asset_desc: input.assetIdentifier,
          },
        ],
        src_pools: null,
        recipient_pays_fee: null,
        confirmations: null,
      },
    };
    return {
      ok: true,
      data: {
        mutation,
        variables,
        endpoint: this.endpoint,
        assetIdentifierSource:
          'zkool GraphQL query assets(id_account: <issuer_id>) → asset_desc_hash (hex) or asset_name field in the local assets table',
        needsWalletPassword: true,
        needsJwt: true,
        responseFormat:
          'pay returns a String (txid hex). Verify on-chain confirmation via transaction(id: <id>, txid: "<txid>") query which returns { id, txid, account, height, time, value, fee }',
      },
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
