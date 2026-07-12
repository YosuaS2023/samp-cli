// src/utils/downloader.js
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const AdmZip = require('adm-zip');
const { logger } = require('./logger');

const findFileRecursively = (dir, targetRelativePath) => {
  const targetName = path.basename(targetRelativePath);
  let foundPath = null;

  const search = (currentDir) => {
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

const processPackageResources = async (user, repo, currentFolder = 'dependencies') => {
  const repoFullPath = path.join(process.cwd(), currentFolder, repo);
  const repoConfigPath = path.join(repoFullPath, 'pawn.json');

  if (!fs.existsSync(repoConfigPath)) return;

  try {
    const repoConfig = fs.readJsonSync(repoConfigPath);
    if (!repoConfig.resources || !Array.isArray(repoConfig.resources)) return;

    logger.info(`Mendeteksi deklarasi biner (resources) pada ${repo}, mencari rilis resmi...`);

    const currentPlatform = process.platform === 'win32' ? 'windows' : 'linux';
    const matchedResource = repoConfig.resources.find(res => res.platform === currentPlatform);

    if (!matchedResource) {
      logger.warn(`Tidak ada biner resource yang mendukung platform [${currentPlatform}] untuk ${repo}`);
      return;
    }

    const apiUrl = `https://api.github.com/repos/${user}/${repo}/releases/latest`;
    const response = await axios.get(apiUrl, {
      headers: { 'User-Agent': 'Pawn-Package-Manager-CLI' }
    });

    const assets = response.data.assets;
    if (!assets || assets.length === 0) throw new Error("Tidak ada file rilis yang ditemukan di GitHub Release");

    const assetRegex = new RegExp(matchedResource.name);
    const targetAsset = assets.find(asset => assetRegex.test(asset.name));

    if (!targetAsset) {
      logger.warn(`Tidak ada file di GitHub Releases yang cocok dengan pola nama: ${matchedResource.name}`);
      return;
    }

    if (!targetAsset.name.endsWith('.zip')) {
      logger.warn(`Aset rilis berupa [${path.extname(targetAsset.name)}]. Menyimpan langsung mentahannya.`);
      const centralResourcesPath = path.join(process.cwd(), currentFolder, '.resources');
      await fs.ensureDir(centralResourcesPath);
      await downloaderUtil.downloadFile(targetAsset.browser_download_url, path.join(centralResourcesPath, targetAsset.name));
      return;
    }

    const tempResourceZip = path.join(process.cwd(), `${repo}-resource-temp.zip`);
    logger.info(`Mengunduh paket biner resmi: ${targetAsset.name}...`);
    await downloaderUtil.downloadFile(targetAsset.browser_download_url, tempResourceZip);

    const centralResourcesPath = path.join(process.cwd(), currentFolder, '.resources');
    const tempExtractLocation = path.join(process.cwd(), currentFolder, '.temp-extract');
    
    await fs.ensureDir(tempExtractLocation);
    await fs.ensureDir(centralResourcesPath);

    logger.info(`Mengekstrak paket biner ${targetAsset.name}...`);
    const zip = new AdmZip(tempResourceZip);
    zip.extractAllTo(tempExtractLocation, true);

    const assetCategories = ['plugins', 'components', 'filterscripts'];
    for (const category of assetCategories) {
      if (matchedResource[category] && Array.isArray(matchedResource[category])) {
        const projectDestFolder = path.join(process.cwd(), category);
        await fs.ensureDir(projectDestFolder);

        for (const assetPathInsideZip of matchedResource[category]) {
          const extractedAssetFile = findFileRecursively(tempExtractLocation, assetPathInsideZip);
          
          if (extractedAssetFile && fs.existsSync(extractedAssetFile)) {
            const fileName = path.basename(assetPathInsideZip);

            const cacheDest = path.join(centralResourcesPath, assetPathInsideZip);
            fs.ensureDirSync(path.dirname(cacheDest));
            fs.copySync(extractedAssetFile, cacheDest);

            fs.copySync(extractedAssetFile, path.join(projectDestFolder, fileName));
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
        const extractedFile = findFileRecursively(tempExtractLocation, insideZipPath);
        const finalRootDest = path.join(process.cwd(), targetRootPath);

        if (extractedFile && fs.existsSync(extractedFile)) {
          fs.ensureDirSync(path.dirname(finalRootDest));
          fs.copySync(extractedFile, finalRootDest);
          logger.success(`[ROOT FILES] Berhasil memasang file tambahan: ${targetRootPath}`);
        } else {
          logger.error(`File tambahan [${path.basename(insideZipPath)}] tidak ditemukan di dalam ZIP rilis.`);
        }
      }
    }

    fs.removeSync(tempResourceZip);
    fs.removeSync(tempExtractLocation);

  } catch (err) {
    logger.error(`Gagal memproses aset biner dari Release: ${err.message}`);
    throw err; 
  }
};

const downloaderUtil = {
  downloadFile: async (url, outputPath) => {
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
  downloadGithubRepo: async (dependencyString, destFolder = 'dependencies') => {
    const [repoPath, version] = dependencyString.split(':');
    const [user, repo] = repoPath.split('/');

    if (!user || !repo) {
      logger.error(`Format salah: ${dependencyString}. Harus "user/repo" atau "user/repo:version"`);
      return false;
    }

    const tempZipPath = path.join(process.cwd(), `${repo}-temp.zip`);
    const targetExtractPath = path.join(process.cwd(), destFolder);
    const finalRepoPath = path.join(targetExtractPath, repo);
    
    const isLatest = !version || version.toLowerCase() === 'latest' || version === '*';

    const getGithubUrl = (branchOrTag, type = 'heads') => 
      `https://github.com/${user}/${repo}/archive/refs/${type}/${branchOrTag}.zip`;

    const extractZipAndRename = (zipPath) => {
      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();
      if (zipEntries.length === 0) throw new Error("ZIP kosong");
      
      const expectedRootFolder = zipEntries[0].entryName.split('/')[0];
      zip.extractAllTo(targetExtractPath, true);

      const temporaryExtractedFolder = path.join(targetExtractPath, expectedRootFolder);

      if (fs.existsSync(finalRepoPath)) fs.removeSync(finalRepoPath);
      fs.moveSync(temporaryExtractedFolder, finalRepoPath);
    };

    const handleSuccess = (msg) => {
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
          logger.error(`Gagal pada proses branch 'master': ${fallbackError.message}`);
          if (fs.existsSync(tempZipPath)) fs.removeSync(tempZipPath);
          return false;
        }
      }

      logger.error(`Gagal mengunduh versi [${version}]: ${error.message}`);
      return false;
    }
  }
};

module.exports = { downloaderUtil };