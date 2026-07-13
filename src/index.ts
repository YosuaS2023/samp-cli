#!/usr/bin/env node

import { Command } from 'commander';

import initAction from './commands/init.js';

import { logger } from './utils/logger.js';
import { githubService } from './services/githubService.js';
import { ProjectConfig } from './config/ProjectConfig.js';
import { config } from 'node:process';

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
  .command('test')
  .description('test')
  .action(async () => {
    logger.info("Memulai pengecekan file konfigurasi...");

    const config = new ProjectConfig();

    if (config.exists()) {
      logger.success("File pawn.json ditemukan!");

      const pawnjson = config.read();
      
      if (config) {
        if (!pawnjson) {
            logger.error("Gagal membaca pawn.json");
            return;
        }
        logger.log(`\nNama Repositori: ${pawnjson.user}/${pawnjson.repo}`);
        logger.log(`Entry Point: ${pawnjson.entry}`);
        logger.log(`Output File: ${pawnjson.output}\n`);

        logger.info("Mengambil daftar dependensi (includes)...");
        const deps = config.getDependencies();
        
        logger.log("Daftar Dependensi yang ditemukan:");
        
        let index = 1;
        for (const dep of deps) {
          logger.log(`  ${index}. ${dep}`);
          await githubService.downloadRepo(dep);
          index++;
        }

        logger.success("Semua proses pengetesan selesai!");
        
      }
    } else {
      logger.error("File pawn.json TIDAK ditemukan di folder ini.");
    }
  });

program.parse(process.argv);