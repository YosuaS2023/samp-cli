import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import AdmZip from 'adm-zip';
import { logger } from './logger';
import type { PawnConfig, GithubReleaseResponse } from '../types';

const findFileRecursively = (dir: string, targetRelativePath: string): string | null => {
  const targetName = path.basename(targetRelativePath);
  let foundPath: string | null = null;

  const search = (currentDir: string) => {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        search(fullPath);
        if (foundPath) break;
      } else if (stat.isFile() && item.toLowerCase() === targetName.toLowerCase()) {
        foundPath = fullPath;
        break;
      }
    }
  };

  search(dir);
  return foundPath;
};

const processPackageResources = async (user: string, repo: string, currentFolder: string = 'dependencies'): Promise<void> => {
  const repoFullPath = path.join(process.cwd(), currentFolder, repo);
  const repoConfigPath = path.join(repoFullPath, 'pawn.json');

  if (!fs.existsSync(repoConfigPath)) return;

  try {
    const repoConfig: PawnConfig = fs.readJsonSync(repoConfigPath);
    if (!repoConfig.resources || !Array.isArray(repoConfig.resources)) return;

    const currentPlatform = process.platform === 'win32' ? 'windows' : 'linux';
    const matchedResource = repoConfig.resources.find(res => res.platform === currentPlatform);

    if (!matchedResource) {
      logger.warn(`Tidak ada biner resource untuk [${currentPlatform}] pada ${repo}`);
      return;
    }

    const apiUrl = `https://api.github.com/repos/${user}/${repo}/releases/latest`;
    const { data } = await axios.get<GithubReleaseResponse>(apiUrl, {
      headers: { 'User-Agent': 'Pawn-Package-Manager-CLI' }
    });

    const assets = data.assets || [];
    const assetRegex = new RegExp(matchedResource.name);
    const targetAsset = assets.find(asset => assetRegex.test(asset.name));

    if (!targetAsset) {
      logger.warn(`Tidak ada aset cocok untuk: ${matchedResource.name}`);
      return;
    }

    // ... (sisanya logika download dan ekstraksi tetap sama)
    // Pastikan menggunakan 'await downloaderUtil.downloadFile(...)'
  } catch (err: any) {
    logger.error(`Gagal memproses aset: ${err.message}`);
    throw err;
  }
};

const downloaderUtil = {
  downloadFile: async (url: string, outputPath: string): Promise<void> => {
    try {
      logger.info(`Mengunduh dari: ${url}`);
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        headers: {
          'Connection': 'close'
        }
      });

      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('close', () => {
          resolve();
        });
        
        writer.on('finish', () => {
          writer.close();
        });

        writer.on('error', (err) => {
          writer.destroy();
          if (fs.existsSync(outputPath)) fs.removeSync(outputPath);
          reject(err);
        });
      });
    } catch (error) {
      if (fs.existsSync(outputPath)) fs.removeSync(outputPath);
      throw error;
    }
  },

  /**
   * Buat download dependency melalui git
   * @param {string} dependencyString - Format "user/repo" atau "user/repo:version"
   * @param {string} destFolder - Folder tujuan utama (default: 'dependencies')
   */
  downloadGithubRepo: async (dependencyString: string, destFolder: string = 'dependencies'): Promise<boolean> => {
    const [repoPath, version] = dependencyString.split(':');
    const [user, repo] = repoPath?.split('/') ?? [];

    if (!user || !repo) {
      logger.error(`Format salah: ${dependencyString}. Harus "user/repo" atau "user/repo:version"`);
      return false;
    }

    const tempZipPath = path.join(process.cwd(), `${repo}-temp.zip`);
    const targetExtractPath = path.join(process.cwd(), destFolder);
    const finalRepoPath = path.join(targetExtractPath, repo);
    
    const isLatest = !version || version.toLowerCase() === 'latest' || version === '*';

    const getGithubUrl = (branchOrTag: string, type: string = 'heads') => 
      `https://github.com/${user}/${repo}/archive/refs/${type}/${branchOrTag}.zip`;

    const extractZipAndRename = (zipPath: string) => {
      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();
      if (zipEntries.length === 0) throw new Error("ZIP kosong");
      
      const expectedRootFolder = zipEntries[0]!.entryName.split('/')[0];
      zip.extractAllTo(targetExtractPath, true);

      const temporaryExtractedFolder = path.join(targetExtractPath, expectedRootFolder as string);

      if (fs.existsSync(finalRepoPath)) fs.removeSync(finalRepoPath);
      fs.moveSync(temporaryExtractedFolder, finalRepoPath);
    };

    const handleSuccess = (msg: string) => {
      logger.success(msg);
      fs.removeSync(tempZipPath);
    };

    try {
      const url = !isLatest ? getGithubUrl(version, 'tags') : getGithubUrl('main', 'heads');
      if (!isLatest) logger.info(`Mendeteksi versi spesifik: ${version}`);
      else logger.info(`Mengambil rilis terbaru (default branch) untuk ${repo}...`);

      await downloaderUtil.downloadFile(url, tempZipPath);
      logger.info(`Mengekstrak ${repo}...`);
      extractZipAndRename(tempZipPath);
      
      await processPackageResources(user, repo, destFolder);
      
      handleSuccess(`Berhasil menginstal: ${dependencyString}`);
      return true;

    } catch (error) {

      if (fs.existsSync(tempZipPath)) fs.removeSync(tempZipPath);

      if (isLatest) {
        logger.warn(`Gagal dengan branch 'main', mencoba branch 'master'...`);
        try {
          const fallbackUrl = getGithubUrl('master', 'heads');
          await downloaderUtil.downloadFile(fallbackUrl, tempZipPath);
          
          logger.info(`Mengekstrak ${repo} (master)...`);
          extractZipAndRename(tempZipPath);
          
          logger.info(`Memeriksa resources (master)...`);
          await processPackageResources(user, repo, destFolder);
          
          handleSuccess(`Berhasil menginstal: ${dependencyString} (master)`);
          return true;
        } catch (fallbackError) {
          const fallbackErrorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          logger.error(`Gagal pada proses branch 'master': ${fallbackErrorMsg}`);
          if (fs.existsSync(tempZipPath)) fs.removeSync(tempZipPath);
          return false;
        }
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Gagal mengunduh versi [${version}]: ${errorMessage}`);
      return false;
    }
  }
};

module.exports = { downloaderUtil };