export function WalletInstallNotice() {
  return (
    <div className="notice">
      <strong>Noir Wallet was not detected.</strong>
      <p>
        Install the official Noir Wallet browser extension. For this project use the separate
        <strong> Noir testnet build</strong> during development. Do not install extension ZIP files
        from messages or unofficial mirrors.
      </p>
      <p>
        After installing it, refresh this page. Runtime network switching is not used by this POC.
      </p>
      <a href="https://docs.zknoir.com/noir-sdk-integration/" target="_blank" rel="noreferrer">
        Open official Noir installation / SDK guidance
      </a>
    </div>
  );
}
