import fs from 'fs-extra';
import path from 'path';
import AdmZip from 'adm-zip';

// Pindahkan logika findFileRecursively ke sini jika dibutuhkan di tempat lain
export const findFileRecursively = (dir: string, targetRelativePath: string): string | null => {
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

export const extractZipAndRename = (zipPath: string, targetExtractPath: string, finalRepoPath: string): void => {
  const zip = new AdmZip(zipPath);
  const zipEntries = zip.getEntries();
  if (zipEntries.length === 0) throw new Error("ZIP kosong");
  
  const expectedRootFolder = zipEntries[0]!.entryName.split('/')[0];
  zip.extractAllTo(targetExtractPath, true);

  const temporaryExtractedFolder = path.join(targetExtractPath, expectedRootFolder as string);

  if (fs.existsSync(finalRepoPath)) fs.removeSync(finalRepoPath);
  fs.moveSync(temporaryExtractedFolder, finalRepoPath);
};