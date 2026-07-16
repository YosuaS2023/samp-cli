#!/usr/bin/env node

import { Command } from 'commander';

import initAction from './commands/init.js';

import { logger } from './utils/logger.js';
import { githubService } from './services/githubService.js';
import { ProjectConfig } from './config/ProjectConfig.js';

import { buildAction } from './commands/build.js';
import { installCompilerAction, selectCompilerAction } from './commands/compiler.js';

import { parseTest } from './commands/parse.js';
import { runTest } from './commands/test.js';

const program = new Command();

program
  .name('samp')
  .description('CLI utility untuk mengelola project SA-MP')
  .version('1.0.0');

program
  .command('init')
  .description('Inisialisasi project SA-MP baru')
  .action(initAction);

program
  .command('install [dependency]')
  .description('Menginstall sebuah library / plugin')
  .action(async (dependency) => {
    if (!dependency) {
      logger.error("Silakan masukkan nama repositori! Contoh: pawn-lang/YSI-Includes");
      process.exit(1);
    }

    logger.info(`Menyiapkan instalasi untuk: ${dependency}...`);
    
    const sukses = await githubService.downloadRepo(dependency);

    if (sukses) {
      logger.success(`Proses instalasi ${dependency} selesai.`);
      
      const config = new ProjectConfig();
      config.addDependency(dependency);
      
      process.exit(0);
    } else {
      logger.error(`Proses instalasi ${dependency} gagal.`);
      
      process.exit(1);
    }
  });

program 
  .command('parse')
  .description('parse')
  .action(parseTest);

const sourceCode = `
    new myArr[5];
    myArr[10] = 1;
`;

program
  .command('parse2').description('test parse 2').action(() => {
    runTest(sourceCode)
  });
program
  .command('build')
  .description('Kompilasi proyek menggunakan compiler yang diatur di config')
  .action(buildAction);

const compilerCmd = program.command('compiler').description('Manajemen Compiler Pawn');

compilerCmd
  .command('install <version>')
  .description('Unduh dan cache compiler Pawn versi spesifik (misal: 3.10.10)')
  .action(installCompilerAction);

compilerCmd
  .command('use')
  .description('Pilih compiler dari lokal secara interaktif')
  .action(selectCompilerAction);


program.parse(process.argv);