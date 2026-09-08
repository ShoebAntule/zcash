export type ZsaProvider = 'disabled' | 'tx-tool' | 'zkool-graphql';

export type ZsaAssetStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';
export type ZsaTransferStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface ZsaAsset {
  id: string;
  assetIdentifier: string;
  issuanceTxid: string | null;
  provider: ZsaProvider;
  status: ZsaAssetStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ZsaTransfer {
  id: string;
  assetIdentifier: string;
  transferTxid: string | null;
  provider: ZsaProvider;
  status: ZsaTransferStatus;
  recipientAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IssueAssetInput {
  assetIdentifier: string;
}

export interface TransferAssetInput {
  assetIdentifier: string;
  recipientAddress: string;
}

export type ZsaProviderCode =
  'ZSA_PROVIDER_NOT_CONFIGURED' | 'ZSA_TRANSFER_UNAVAILABLE' | 'PROVIDER_ERROR' | 'INVALID_INPUT';

export interface ZsaProviderResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: ZsaProviderCode;
}

export interface DryRunTransferInput {
  assetIdentifier: string;
  recipientAddress: string;
  amount: number;
}

export interface DryRunResult {
  mutation: string;
  variables: Record<string, unknown>;
  endpoint: string;
  assetIdentifierSource: string;
  needsWalletPassword: boolean;
  needsJwt: boolean;
  responseFormat: string;
}

export interface ZsaService {
  issueAsset(input: IssueAssetInput): Promise<ZsaProviderResult<ZsaAsset>>;
  transferAsset(input: TransferAssetInput): Promise<ZsaProviderResult<ZsaTransfer>>;
  getAssetStatus(assetIdentifier: string): Promise<ZsaProviderResult<ZsaAsset>>;
  getRecipientHolding(
    assetIdentifier: string,
    recipientAddress: string,
  ): Promise<ZsaProviderResult<ZsaTransfer | null>>;
  verifyTransfer(transferId: string): Promise<ZsaProviderResult<ZsaTransfer>>;
  dryRunTransfer(input: DryRunTransferInput): Promise<ZsaProviderResult<DryRunResult>>;
}
