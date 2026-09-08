import { copyFile, access } from 'node:fs/promises';
for (const workspace of ['frontend', 'backend']) {
  const destination = new URL(`../${workspace}/.env`, import.meta.url);
  try {
    await access(destination);
    console.log(`${workspace}/.env retained`);
  } catch {
    await copyFile(new URL(`../${workspace}/.env.example`, import.meta.url), destination);
    console.log(`${workspace}/.env created from template`);
  }
}
