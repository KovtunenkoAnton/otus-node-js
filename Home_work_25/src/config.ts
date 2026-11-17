import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export interface MigratorConfig {
  database: string | (() => any);
  migrationsDir: string;
  pattern?: string;
  storage?: 'sequelize' | 'json';
  transaction?: 'all' | 'each' | 'none';
  logger?: 'pretty' | 'json';
}

export async function loadConfig(configPath?: string): Promise<MigratorConfig> {
  const file = configPath
    ? resolve(process.cwd(), configPath)
    : resolve(process.cwd(), 'migrator.config.ts');

  try {
    const mod = await import(pathToFileURL(file).href);
    return mod.default ?? mod;
  } catch (err) {
    console.error(`❌ Не удалось загрузить конфиг: ${file}`);
    console.error(`   Убедитесь, что файл существует и экспортирует объект конфигурации.`);
    process.exit(1);
  }
}