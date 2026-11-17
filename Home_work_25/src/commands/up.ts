import { createMigrator } from '../migrator.js';

export async function upCommand(options: { to?: string; step?: number; config?: string }) {
  const { migrator, sequelize } = await createMigrator(options.config);

  try {
    let result;

    if (options.to) {
      result = await migrator.up({ to: options.to });
    } else if (options.step) {
      result = await migrator.up({ step: options.step });
    } else {
      result = await migrator.up();
    }

    if (result.length === 0) {
      console.log('Нет ожидающих миграций.');
    } else {
      console.log(`Применено миграций: ${result.length}`);
      result.forEach((m) => console.log(`   • ${m.name}`));
    }

    process.exit(0);
  } catch (err: any) {
    console.error(`Ошибка миграции: ${err.message}`);
    console.error(`Миграция: ${err.migration?.name ?? 'неизвестна'}`);
    console.error(`Восстановление: проверьте SQL и повторите, либо откатите через "migrate down".`);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}