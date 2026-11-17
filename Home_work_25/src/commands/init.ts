import { mkdir, writeFile, readFile } from 'node:fs/promises';

export async function initCommand() {
  await mkdir('migrations', { recursive: true });

  const configTpl = await readFile('templates/migrator.config.ts.tpl', 'utf-8');
  await writeFile('migrator.config.ts', configTpl);

  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
  const sample = `migrations/${ts}-example.ts`;
  const migTpl = await readFile('templates/migration.ts.tpl', 'utf-8');
  await writeFile(sample, migTpl);

  console.log('Создано: migrations/, migrator.config.ts, ' + sample);
  process.exit(0);
}