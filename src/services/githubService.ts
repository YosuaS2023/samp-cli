import path from 'path';
import fs from 'fs-extra';
import axios from 'axios';
import AdmZip from 'adm-zip';

import { logger } from '../utils/logger.js';
import { downloadFile } from '../utils/downloader.js';
import { extractZipAndRename, findFileRecursively } from '../utils/resourceProcessor.js';
import type { DependencyPawnConfig } from '../types/pawn.js';

/**
 * Service untuk menangani interaksi dengan GitHub dan instalasi dependency
 */
export const githubService = {
  
  /**
   * Function mengolah resource tambahan dari pawn.json (versi dependency)
   */
  async processResources(user: string, repo: string, currentFolder: string = 'dependencies'): Promise<void> {
    const repoFullPath = path.join(process.cwd(), currentFolder, repo);
    const repoConfigPath = path.join(repoFullPath, 'pawn.json');

    if (!fs.existsSync(repoConfigPath)) return;

    try {
      const repoConfig: DependencyPawnConfig = fs.readJsonSync(repoConfigPath);
      if (!repoConfig.resources || !Array.isArray(repoConfig.resources)) return;

      logger.info(`Mendeteksi deklarasi biner (resources) pada ${repo}, mencari rilis resmi...`);

      const currentPlatform = process.platform === 'win32' ? 'windows' : 'linux';
      const matchedResource = repoConfig.resources.find(res => res.platform === currentPlatform);

      if (!matchedResource) {
        logger.warn(`Tidak ada biner resource yang mendukung platform [${currentPlatform}] untuk ${repo}`);
        return;
      }

      const { data } = await axios.get(`https://api.github.com/repos/${user}/${repo}/releases/latest`, {
        headers: { 'User-Agent': 'Pawn-Package-Manager-CLI' }
      });

      const assets = data.assets;
      if (!assets || assets.length === 0) throw new Error("Tidak ada file rilis yang ditemukan di GitHub Release");

      const assetRegex = new RegExp(matchedResource.name);
      const targetAsset = assets.find((asset: any) => assetRegex.test(asset.name));

      if (!targetAsset) {
        logger.warn(`Tidak ada file di GitHub Releases yang cocok dengan pola nama: ${matchedResource.name}`);
        return;
      }

      const centralResourcesPath = path.join(process.cwd(), currentFolder, '.resources');

      if (!targetAsset.name.endsWith('.zip')) {
        logger.warn(`Aset rilis berupa [${path.extname(targetAsset.name)}]. Menyimpan langsung mentahannya.`);
        await fs.ensureDir(centralResourcesPath);
        await downloadFile(targetAsset.browser_download_url, path.join(centralResourcesPath, targetAsset.name));
        return;
      }

      const tempResourceZip = path.join(process.cwd(), `${repo}-resource-temp.zip`);
      logger.info(`Mengunduh paket biner resmi: ${targetAsset.name}...`);
      await downloadFile(targetAsset.browser_download_url, tempResourceZip);

      const tempExtractLocation = path.join(process.cwd(), currentFolder, '.temp-extract');
      
      await fs.ensureDir(tempExtractLocation);
      await fs.ensureDir(centralResourcesPath);
      
      logger.info(`Mengekstrak paket biner ${targetAsset.name}...`);
      const zip = new AdmZip(tempResourceZip);
      zip.extractAllTo(tempExtractLocation, true);

      const assetCategories = ['plugins', 'components', 'filterscripts'] as const;
      for (const category of assetCategories) {
        const categoryAssets = matchedResource[category];
        if (categoryAssets && Array.isArray(categoryAssets)) {
          const projectDestFolder = path.join(process.cwd(), category);
          await fs.ensureDir(projectDestFolder);

          for (const assetPathInsideZip of categoryAssets) {
            const extractedAssetFile = await findFileRecursively(tempExtractLocation, assetPathInsideZip);
            
            if (extractedAssetFile && fs.existsSync(extractedAssetFile)) {
              const fileName = path.basename(assetPathInsideZip);
              
              const cacheDest = path.join(centralResourcesPath, assetPathInsideZip);
              await fs.ensureDir(path.dirname(cacheDest));
              await fs.copy(extractedAssetFile, cacheDest);

              await fs.copy(extractedAssetFile, path.join(projectDestFolder, fileName));
              logger.success(`[${category.toUpperCase()}] Berhasil memasang ${fileName}`);
            } else {
              logger.error(`File [${path.basename(assetPathInsideZip)}] tidak ditemukan di dalam ZIP rilis meskipun sudah dicari rekursif.`);
            }
          }
        }
      }

      if (matchedResource.files && typeof matchedResource.files === 'object') {
        logger.info(`Memeriksa file dependensi tambahan ("files")...`);
        
        for (const [insideZipPath, targetRootPath] of Object.entries(matchedResource.files)) {
          const extractedFile = await findFileRecursively(tempExtractLocation, insideZipPath);
          const finalRootDest = path.join(process.cwd(), targetRootPath);

          if (extractedFile && fs.existsSync(extractedFile)) {
            await fs.ensureDir(path.dirname(finalRootDest));
            await fs.copy(extractedFile, finalRootDest);
            logger.success(`[ROOT FILES] Berhasil memasang file tambahan: ${targetRootPath}`);
          } else {
            logger.error(`File tambahan [${path.basename(insideZipPath)}] tidak ditemukan di dalam ZIP rilis.`);
          }
        }
      }

      await fs.remove(tempResourceZip);
      await fs.remove(tempExtractLocation);
      
      logger.info(`Resource ${repo} berhasil diproses dan disinkronisasikan.`);

    } catch (err: any) {
      logger.error(`Gagal memproses aset biner dari Release: ${err.message}`);
      
      const tempResourceZip = path.join(process.cwd(), `${repo}-resource-temp.zip`);
      const tempExtractLocation = path.join(process.cwd(), currentFolder, '.temp-extract');
      if (fs.existsSync(tempResourceZip)) await fs.remove(tempResourceZip);
      if (fs.existsSync(tempExtractLocation)) await fs.remove(tempExtractLocation);
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