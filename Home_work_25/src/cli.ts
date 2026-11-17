#!/usr/bin/env node
import { Command } from 'commander';
import { upCommand } from './commands/up.js';
import { downCommand } from './commands/down.js';
import { statusCommand } from './commands/status.js';
import { initCommand } from './commands/init.js';
import { createCommand } from './commands/create.js';

const program = new Command();

program
  .name('migrate')
  .description('migrate')
  .version('0.1.0');

program
  .command('init')
  .description('Создать структуру проекта')
  .action(initCommand);

program
  .command('create')
  .description('Создать файл миграции из шаблона')
  .argument('<name>', 'Имя миграции, например add-users-table')
  .action(createCommand);

program
  .command('up')
  .description('Применить миграции')
  .option('--to <name>', 'Применить до указанной миграции включительно')
  .option('--step <number>', 'Применить N миграций', parseInt)
  .option('--config <path>', 'Путь к конфигу')
  .action(upCommand);

program
  .command('down')
  .description('Откатить миграции')
  .option('--to <name>', 'Откатить до указанной миграции включительно')
  .option('--step <number>', 'Откатить N миграций', parseInt)
  .option('--config <path>', 'Путь к конфигу')
  .option('--force', 'Разрешить откат в production')
  .action(downCommand);

program
  .command('status')
  .description('Показать статус миграций')
  .option('--config <path>', 'Путь к конфигу')
  .action(statusCommand);

program.parse();