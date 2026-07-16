import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';
import { globSync } from 'glob';
import { logger } from '../utils/logger.js';
import { ensureCompilerCache } from '../utils/compilerManager.js';
import type { ProjectPawnConfig } from '../types/pawn.js';

// Perbarui tipe data lokal atau tambahkan langsung di file types kamu
type CompileConfig = Pick<
  ProjectPawnConfig,
  "entry" | "output" | "dependencies" | "build"
> & {
  build?: {
    compiler?: { preset?: string };
    includes?: string[]; // Tambahkan definisi ini
  }
};

export async function buildAction(): Promise<void> {
  const configPath = path.join(process.cwd(), 'pawn.json');
  if (!fs.existsSync(configPath)) {
    logger.error("File pawn.json tidak ditemukan!");
    process.exit(1);
  }
  
  const config: CompileConfig = fs.readJsonSync(configPath);
  
  const targetVersion = config.build?.compiler?.preset || '3.10.10'; 
  const compilerExePath = await ensureCompilerCache(targetVersion);

  const entryPoint = config.entry || 'gamemodes/main.pwn';
  const entryDir = path.dirname(entryPoint);

  // 1. Inisialisasi include paths bawaan standar
  const includePaths: string[] = [
    path.join(process.cwd(), 'pawno', 'include'),
    path.join(process.cwd(), entryDir) 
  ];

  // 2. Tambahkan custom includes dari pawn.json jika didefinisikan oleh user
  if (config.build?.includes && Array.isArray(config.build.includes)) {
    config.build.includes.forEach((customPath) => {
      const absoluteCustomPath = path.resolve(process.cwd(), customPath);
      
      // Validasi apakah foldernya memang ada di komputer user sebelum dimasukkan
      if (fs.existsSync(absoluteCustomPath)) {
        // Mencegah duplikasi path di dalam array
        if (!includePaths.includes(absoluteCustomPath)) {
          includePaths.push(absoluteCustomPath);
        }
      } else {
        logger.warn(`[Build] Custom include path tidak ditemukan: ${customPath}`);
      }
    });
  }

  // 3. Proses Dependencies (Logika glob tetap sama)
  if (config.dependencies && Array.isArray(config.dependencies)) {
    config.dependencies.forEach((depPath) => {
      const [user, repo] = depPath.split('/');
      if (!repo) {
        logger.error(`Repo invalid! Format dependency harus "user/repo"`);
        process.exit(1);
      }

      const localRepoPath = path.join(process.cwd(), 'dependencies', repo);

      if (fs.existsSync(localRepoPath)) {
        const globPattern = path.join(localRepoPath, '**', '*.inc').replace(/\\/g, '/');
        const incFiles = globSync(globPattern, { absolute: true });

        if (incFiles.length > 0) {
          const uniqueDirs = new Set(incFiles.map(file => path.dirname(file)));
          uniqueDirs.forEach(dir => {
            if (!includePaths.includes(dir)) includePaths.push(dir);
          });
          logger.info(`[Build] Include dari dependency ${user}/${repo} berhasil dimuat.`);
        } else {
          logger.warn(`[Build] Dependency ${user}/${repo} ditemukan, tapi tidak memiliki file .inc`);
        }
      } else {
        logger.error(`[Build] Folder dependency ${repo} tidak ditemukan.`);
      }
    });
  }

  const outputDir = config.output || 'gamemodes';
  const outputPath = path.join(outputDir, path.basename(entryPoint, '.pwn') + '.amx');

  const compilerArgs = [
    entryPoint,
    `-o${outputPath}`
  ];

  // Masukkan semua path ke argumen kompiler (-i)
  includePaths.forEach(p => compilerArgs.push(`-i${p}`));

  logger.info(`Memulai kompilasi menggunakan preset compiler ${targetVersion}...`);

  const buildProcess = spawn(compilerExePath, compilerArgs, {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  buildProcess.on('close', (code) => {
    if (code === 0) {
      logger.success(`Compile Sukses! Output: ${outputPath}`);
    } else {
      logger.error(`Compile Gagal dengan kode exit: ${code}`);
    }
    process.exit(code);
  });
}