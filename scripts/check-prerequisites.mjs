import { execSync } from 'node:child_process';
import fs from 'node:fs';
function check(label, cmd) {
  try {
    const value = execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] })
      .toString()
      .trim()
      .split('\n')[0];
    return { label, ok: true, value };
  } catch {
    return { label, ok: false, value: 'not found' };
  }
}
const checks = [
  check('Git', 'git --version'),
  check('Node.js', 'node --version'),
  check('npm', 'npm --version'),
  check('VS Code CLI', 'code --version'),
  check('PostgreSQL client', 'psql --version'),
];
console.log('\nLocal prerequisite check\n');
for (const x of checks) console.log(`${x.ok ? '✓' : '✗'} ${x.label}: ${x.value}`);
console.log('\nManual checks required:');
console.log('- Noir Wallet testnet extension installed in browser');
console.log('- Exact ZSA test tooling installed after the hands-on POC selects it');
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync(
  'docs/prerequisites-local.json',
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      checks,
      manual: { noirTestnetExtension: 'MANUAL', zsaTooling: 'PENDING_SELECTION' },
    },
    null,
    2,
  ) + '\n',
);
