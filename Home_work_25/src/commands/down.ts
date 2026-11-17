import { createMigrator } from '../migrator.js';

export async function downCommand(options: { to?: string; step?: number; config?: string; force?: boolean }) {
  const env = process.env.NODE_ENV ?? 'development';
  const isProd = env === 'production';

  if (isProd && !options.force) {
    console.error('Откат в production требует флага --force');
    process.exit(1);
  }

  const { migrator, sequelize } = await createMigrator(options.config);

  try {
    let result;

    if (options.to) {
      result = await migrator.down({ to: options.to });
    } else if (options.step) {
      result = await migrator.down({ step: options.step });
    } else {
      result = await migrator.down();
    }

    if (result.length === 0) {
      console.log('Нечего откатывать.');
    } else {
      console.log(`Откачено миграций: ${result.length}`);
      result.forEach((m) => console.log(`   • ${m.name}`));
    }

    process.exit(0);
  } catch (err: any) {
    console.error(`Ошибка отката: ${err.message}`);
    console.error(`   Миграция: ${err.migration?.name ?? 'неизвестна'}`);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}