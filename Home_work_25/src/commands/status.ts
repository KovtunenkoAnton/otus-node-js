import { createMigrator } from '../migrator.js';

export async function statusCommand(options: { config?: string }) {
  const { migrator, sequelize } = await createMigrator(options.config);

  try {
    const executed = await migrator.executed();
    const pending = await migrator.pending();

    const rows = [
      ...executed.map((m) => ({ name: m.name, appliedAt: (m as any).timestamp ?? '—', state: 'executed' })),
      ...pending.map((m) => ({ name: m.name, appliedAt: '—', state: 'pending' })),
    ];

    console.log('name | appliedAt | state');
    console.log('-----|-----------|------');
    rows.forEach((r) => console.log(`${r.name} | ${r.appliedAt} | ${r.state}`));

    process.exit(0);
  } catch (err: any) {
    console.error(`Ошибка получения статуса: ${err.message}`);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}