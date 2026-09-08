import { shortenAddress } from '../utils/address';

interface Props {
  label: string;
  address: string | null | undefined;
  capability: 'shielded' | 'transparent';
}

export function AddressCapability({ label, address, capability }: Props) {
  return (
    <div className="account-card">
      <div>
        <strong>{label}</strong>
      </div>
      <div className="value">
        <code title={address ?? ''}>{shortenAddress(address)}</code>
      </div>
      <div className="label">
        {capability === 'shielded'
          ? 'Shielded: intended for privacy-preserving Zcash receive/send flows where supported.'
          : 'Transparent: public on-chain transaction details; use only when compatibility requires it.'}
      </div>
    </div>
  );
}
