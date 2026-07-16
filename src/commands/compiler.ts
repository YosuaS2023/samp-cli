import fs from 'fs-extra';
import path from 'path';
import { select } from '@inquirer/prompts';
import { ensureCompilerCache, getLocalCompilers } from '../utils/compilerManager.js';
import { logger } from '../utils/logger.js';
import type { ProjectPawnConfig } from '../types/pawn.js';

const CONFIG_PATH = path.join(process.cwd(), 'pawn.json');

export async function installCompilerAction(version: string) {
    if (!version) {
        logger.error('Harap sertakan versi, contoh: samp compiler install 3.10.10');
        return;
    }
    await ensureCompilerCache(version);
}

export async function selectCompilerAction() {
    const localVersions = getLocalCompilers();

    if (localVersions.length === 0) {
        logger.error('⚠ Tidak ada compiler yang terinstal di lokal.');
        logger.info('Gunakan perintah: samp compiler install <versi>');
        return;
    }

    // Menggunakan select() modular
    const selectedVersion = await select({
        message: 'Pilih versi compiler yang ingin digunakan untuk proyek ini:',
        choices: localVersions.map(version => ({
            name: version,
            value: version
        }))
    });

    // Update samp.config.json
    if (!fs.existsSync(CONFIG_PATH)) {
        logger.error('samp.config.json tidak ditemukan di direktori ini.');
        return;
    }

    const config = fs.readJsonSync(CONFIG_PATH) as ProjectPawnConfig;
    if (!config.build.compiler.preset) {
      config.build.compiler = {
        preset: ''
      };
    }

    config.build.compiler.preset = selectedVersion;
    
    config.build.compiler.preset = selectedVersion;
    fs.writeJsonSync(CONFIG_PATH, config, { spaces: 2 });

    logger.success(`Versi compiler untuk proyek ini berhasil diubah ke: ${selectedVersion}`);
}