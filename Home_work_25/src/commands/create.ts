import { writeFile, readFile } from 'node:fs/promises';

export async function createCommand(name: string) {
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
  const filename = `migrations/${ts}-${name}.ts`;
  const tpl = await readFile('templates/migration.ts.tpl', 'utf-8');
  await writeFile(filename, tpl);
  console.log(`Создан файл: ${filename}`);
  process.exit(0);
}