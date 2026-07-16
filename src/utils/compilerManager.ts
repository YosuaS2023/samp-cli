import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import axios from 'axios';
import AdmZip from 'adm-zip';
import pc from 'picocolors';
import { logger } from './logger.js';

// Path Cache Global: ~/.samp-cli/cache/compilers/
const CACHE_DIR = path.join(os.homedir(), '.samp-cli', 'cache', 'compilers');

export async function ensureCompilerCache(version: string): Promise<string> {
    const compilerDir = path.join(CACHE_DIR, version);
    const isWin = process.platform === 'win32';

    const osSuffix = isWin ? 'windows' : 'linux';

    const compilerExe = isWin ? 'pawncc.exe' : 'pawncc';
    
    const innerFolder = `pawnc-${version}-${osSuffix}`;
    const compilerPath = path.join(compilerDir, innerFolder, 'bin', compilerExe);

    if (fs.existsSync(compilerPath)) {
        return compilerPath;
    }

    logger.info(`Mengunduh compiler Pawn versi ${version} dari GitHub...`);
    
    const ext = isWin ? 'zip' : 'tar.gz';
    const releaseUrl = `https://github.com/pawn-lang/compiler/releases/download/v${version}/pawnc-${version}-${osSuffix}.${ext}`;
    const tmpFile = path.join(os.homedir(), `tmp_compiler_${version}.${ext}`);

    try {
        fs.ensureDirSync(compilerDir);
        
        const writer = fs.createWriteStream(tmpFile);
        const response = await axios({ url: releaseUrl, method: 'GET', responseType: 'stream' });
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        if (isWin) {
            const zip = new AdmZip(tmpFile);
            zip.extractAllTo(compilerDir, true);
        } else {
            logger.info('Ekstraksi tar.gz untuk Linux memerlukan library tambahan (tar).');
        }

        fs.unlinkSync(tmpFile); 

        if (!isWin && fs.existsSync(compilerPath)) {
            fs.chmodSync(compilerPath, '755');
        }

        logger.info(`✔ Compiler versi ${version} berhasil di-cache ke sistem lokal!`);
        return compilerPath;

    } catch (err: any) {
        console.log(pc.red(`✖ Gagal mengunduh compiler: ${err.message}`));
        process.exit(1);
    }
}

export function getLocalCompilers(): string[] {
    if (!fs.existsSync(CACHE_DIR)) return [];
    return fs.readdirSync(CACHE_DIR).filter(file => {
        return fs.statSync(path.join(CACHE_DIR, file)).isDirectory();
    });
}