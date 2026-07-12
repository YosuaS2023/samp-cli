#!/usr/bin/env node

const { Command } = require('commander');

const initAction = require('./src/commands/init');

const { configUtil } = require('./src/utils/config');
const { logger } = require('./src/utils/logger');
const { downloaderUtil } = require('./src/utils/downloader');

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
    
    const sukses = await downloaderUtil.downloadGithubRepo(dependency);

    if (sukses) {
      logger.success(`Proses instalasi ${dependency} selesai.`);
      configUtil.addDependency(dependency);
      
      process.exit(0);
    } else {
      logger.error(`Proses instalasi ${dependency} gagal.`);
      
      process.exit(1);
    }
  });

program
  .command('test')
  .description('test')
  .action(async () => {
    logger.info("Memulai pengecekan file konfigurasi...");

    if (configUtil.exists()) {
      logger.success("File pawn.json ditemukan!");

      const config = configUtil.read();
      
      if (config) {
        logger.log(`\nNama Repositori: ${config.user}/${config.repo}`);
        logger.log(`Entry Point: ${config.entry}`);
        logger.log(`Output File: ${config.output}\n`);

        logger.info("Mengambil daftar dependensi (includes)...");
        const deps = configUtil.getDependencies();
        
        logger.log("Daftar Dependensi yang ditemukan:");
        
        let index = 1;
        for (const dep of deps) {
          logger.log(`  ${index}. ${dep}`);
          await downloaderUtil.downloadGithubRepo(dep);
          index++;
        }

        logger.success("Semua proses pengetesan selesai!");
        
      }
    } else {
      logger.error("File pawn.json TIDAK ditemukan di folder ini.");
    }
  });

program.parse(process.argv);