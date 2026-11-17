import { Umzug, SequelizeStorage } from 'umzug';
import { Sequelize } from 'sequelize';
import { loadConfig } from './config.js';

function createLogger(mode: 'pretty' | 'json') {
  if (mode === 'json') {
    return {
      info: (e: any) => console.log(JSON.stringify(e)),
      warn: (e: any) => console.error(JSON.stringify(e)),
      error: (e: any) => console.error(JSON.stringify(e)),
      debug: () => {},
    };
  }
  return console;
}

export async function createMigrator(configPath?: string) {
  const config = await loadConfig(configPath);

  const sequelize = typeof config.database === 'string'
    ? new Sequelize(config.database, { logging: false })
    : config.database();

  const logger = createLogger(config.logger ?? 'pretty');

  const migrator = new Umzug({
    migrations: {
      glob: [`${config.migrationsDir}/*.ts`, { cwd: process.cwd() }],
      resolve: ({ name, path, context }) => {
        return {
          name,
          up: async () => {
            const mod = await import(path!);
            return mod.up({ context });
          },
          down: async () => {
            const mod = await import(path!);
            return mod.down({ context });
          },
        };
      },
    },
    context: sequelize.getQueryInterface(),
    storage: config.storage === 'json'
      ? undefined // можно реализовать кастомный JSON storage
      : new SequelizeStorage({ sequelize }),
    logger,
  });

  return { migrator, sequelize, config };
}
