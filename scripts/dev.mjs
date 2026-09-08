import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const spawnOptions = process.platform === 'win32' ? { shell: true } : {};

const children = [
  spawn(npmCommand, ['run', 'dev:backend'], { stdio: 'inherit', ...spawnOptions }),
  spawn(npmCommand, ['run', 'dev:frontend'], { stdio: 'inherit', ...spawnOptions }),
];

function stop() {
  for (const child of children) child.kill('SIGTERM');
}

process.on('SIGINT', () => {
  stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stop();
  process.exit(0);
});
