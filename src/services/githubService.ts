import path from 'path';
import fs from 'fs-extra';
import axios from 'axios';
import { glob } from 'glob'; // Pastikan sudah terinstall: npm install glob

import { logger } from '../utils/logger.js';
import { downloadFile } from '../utils/downloader.js';
import { extractZipAndRename } from '../utils/resourceProcessor.js';
import type { DependencyPawnConfig } from '../types/pawn.js';
import type { GithubReleaseResponse } from '../types/github.js';

/**
 * Service untuk menangani interaksi dengan GitHub dan instalasi dependency
 */
export const githubService = {
  
  /**
   * Memproses resource biner (misal: .dll atau .so) berdasarkan pawn.json
   */
  async processResources(user: string, repo: string, currentFolder: string = 'dependencies'): Promise<void> {
    const repoFullPath = path.join(process.cwd(), currentFolder, repo);
    const repoConfigPath = path.join(repoFullPath, 'pawn.json');

    if (!fs.existsSync(repoConfigPath)) return;

    try {
      const repoConfig: DependencyPawnConfig = fs.readJsonSync(repoConfigPath);
      const currentPlatform = process.platform === 'win32' ? 'windows' : 'linux';
      const matchedResource = repoConfig.resources?.find(res => res.platform === currentPlatform);
      if (!matchedResource) return;

      // 1. Download
      const { data } = await axios.get(`https://api.github.com/repos/${user}/${repo}/releases/latest`, {
        headers: { 'User-Agent': 'Pawn-Package-Manager-CLI' }
      });
      const targetAsset = data.assets.find((a: any) => new RegExp(matchedResource.name).test(a.name));
      if (!targetAsset) return;

      const downloadPath = path.join(repoFullPath, targetAsset.name);
      await downloadFile(targetAsset.browser_download_url, downloadPath);

      // 2. Ekstrak langsung di repoFullPath (tempat file zip berada)
      if (matchedResource.archive) {
        // Kita langsung ekstrak di repoFullPath
        await extractZipAndRename(downloadPath, repoFullPath, repoFullPath);

        // Helper dengan target direktori repoFullPath
        const processMapping = async (patterns: string[] | undefined, targetDir: string) => {
          if (!patterns) return;
          for (const pattern of patterns) {
            // Cari file di dalam repoFullPath
            const files = await glob(`**/${pattern}`, { cwd: repoFullPath, absolute: true });
            for (const file of files) {
              const dest = path.join(process.cwd(), targetDir, path.basename(file));
              await fs.ensureDir(path.dirname(dest));
              await fs.copy(file, dest);
            }
          }
        };

        await processMapping(matchedResource.includes, 'pawno/include');
        await processMapping(matchedResource.plugins, 'plugins');
        await processMapping(matchedResource.components, 'components');

        // Khusus untuk files (Record<string, string>)
        if (matchedResource.files) {
          for (const [srcPattern, destName] of Object.entries(matchedResource.files)) {
            const files = await glob(`**/${srcPattern}`, { cwd: repoFullPath, absolute: true });
            for (const file of files) {
              const dest = path.join(process.cwd(), destName);
              await fs.ensureDir(path.dirname(dest));
              await fs.copy(file, dest);
            }
          }
        }
      }

      // Opsional: Hapus file zip setelah selesai, tapi biarkan hasil ekstraksinya
      await fs.remove(downloadPath);
      logger.info(`Resource ${repo} berhasil diinstal langsung.`);
      
    } catch (err: any) {
      logger.error(`Gagal memproses resource: ${err.message}`);
    }
  },

  /**
   * Fungsi utama untuk mengunduh dan menginstal repository
   */
  async downloadRepo(dependencyString: string, destFolder: string = 'dependencies'): Promise<boolean> {
    const [repoPath, version] = dependencyString.split(':');
    const [user, repo] = repoPath?.split('/') ?? [];

    if (!user || !repo) {
      logger.error(`Format salah: ${dependencyString}. Gunakan "user/repo"`);
      return false;
    }

    const tempZipPath = path.join(process.cwd(), `${repo}-temp.zip`);
    const targetExtractPath = path.join(process.cwd(), destFolder);
    const finalRepoPath = path.join(targetExtractPath, repo);

    const isLatest =
      !version || version.toLowerCase() === 'latest' || version === '*';

    const getGithubUrl = (
      branchOrTag: string,
      type: 'heads' | 'tags' = 'heads'
    ) => `https://github.com/${user}/${repo}/archive/refs/${type}/${branchOrTag}.zip`;

    try {
      if (isLatest) {
        const branches = ['main', 'master'];
        let downloaded = false;

        for (const branch of branches) {
          try {
            await downloadFile(getGithubUrl(branch), tempZipPath);
            downloaded = true;
            break;
          } catch {
            // Coba branch berikutnya
          }
        }

        if (!downloaded) {
          throw new Error(
            `Repository tidak memiliki branch 'main' maupun 'master'.`
          );
        }
      } else {
        await downloadFile(getGithubUrl(version, 'tags'), tempZipPath);
      }

      extractZipAndRename(
        tempZipPath,
        targetExtractPath,
        finalRepoPath
      );

      await this.processResources(user, repo, destFolder);

      logger.success(`Berhasil menginstal: ${dependencyString}`);

      if (fs.existsSync(tempZipPath)) {
        fs.removeSync(tempZipPath);
      }

      return true;
    } catch (error) {
      if (fs.existsSync(tempZipPath)) {
        fs.removeSync(tempZipPath);
      }

      logger.error(
        `Gagal mengunduh ${dependencyString}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );

      return false;
    }
  }
};