import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger';

import type { PawnConfig } from '../types';
const CONFIG_FILE = 'pawn.json';

type Dependencies = string[] | Record<string, string>;

export const configUtil = {
    getConfigPath(): string {
        return path.join(process.cwd(), CONFIG_FILE);
    },

    exists(): boolean {
        return fs.existsSync(this.getConfigPath());
    },

    read(): PawnConfig | null {
        if (!this.exists()) {
            logger.error(`${CONFIG_FILE} tidak ditemukan di folder ini!`);
            return null;
        }

        try {
            return fs.readJsonSync(this.getConfigPath()) as PawnConfig;
        } catch (err) {
            const error = err as Error;
            logger.error(`Gagal membaca atau memproses ${CONFIG_FILE}: ${error.message}`);
            return null;
        }
    },

    write(data: PawnConfig): boolean {
        try {
            fs.outputJsonSync(this.getConfigPath(), data, {
                spaces: 2,
            });

            logger.success(`${CONFIG_FILE} berhasil disimpan/diperbarui.`);
            return true;
        } catch (err) {
            const error = err as Error;
            logger.error(`Gagal menulis ke ${CONFIG_FILE}: ${error.message}`);
            return false;
        }
    },

    addDependency(newDep: string): boolean {
        const config: PawnConfig = this.read() ?? {};

        if (!config.dependencies) {
            config.dependencies = [];
        }

        if (Array.isArray(config.dependencies)) {
            if (config.dependencies.includes(newDep)) {
                logger.warn(`Dependensi "${newDep}" sudah ada di pawn.json.`);
                return true;
            }

            config.dependencies.push(newDep);
        } else {
            const [repoPath, version] = newDep.split(':');

            config.dependencies[repoPath] = version || 'latest';
        }

        return this.write(config);
    },

    getDependencies(): string[] {
        const config = this.read();

        if (!config || !config.dependencies) {
            return [];
        }

        // ["user/repo", "user/repo:version"]
        if (Array.isArray(config.dependencies)) {
            return config.dependencies;
        }

        // { "user/repo": "version", "user/repo2": "latest" }
        return Object.entries(config.dependencies).map(([repo, version]) => {
            if (!version || version === 'latest' || version === '*') {
                return repo;
            }

            return `${repo}:${version}`;
        });
    },
};