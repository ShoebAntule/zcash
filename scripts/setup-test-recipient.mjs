import fs from 'node:fs';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import path from 'node:path';

const rl = readline.createInterface({ input, output });

console.log(`
PART 4 — dedicated test recipient setup

1. Open the official Noir TESTNET extension.
2. Create a NEW wallet used only as the project test recipient.
3. Back up its recovery phrase OFFLINE.
4. Never paste the phrase/private key into this terminal, Git, ChatGPT, or .env.
5. Copy only its public TESTNET receive address.
`);

const address = (await rl.question('Paste the public testnet recipient address only: ')).trim();
rl.close();

if (!address || address.length < 20) {
  console.error('Recipient address looks invalid/empty. Nothing was written.');
  process.exit(1);
}

const envPath = path.resolve('backend/.env');
let env = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, 'utf8')
  : fs.readFileSync(path.resolve('backend/.env.example'), 'utf8');

if (/^MINT_PAYMENT_ADDRESS=.*$/m.test(env)) {
  env = env.replace(/^MINT_PAYMENT_ADDRESS=.*$/m, `MINT_PAYMENT_ADDRESS=${address}`);
} else {
  env += `\nMINT_PAYMENT_ADDRESS=${address}\n`;
}

fs.writeFileSync(envPath, env);
console.log(`Wrote public recipient address to ${envPath}`);
console.log('The .env file is gitignored. No wallet secret was requested or stored.');
