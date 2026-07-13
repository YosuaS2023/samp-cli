import fs from 'fs-extra';
import path from 'path';
import AdmZip from 'adm-zip';
import { glob } from 'glob';

export async function findFileRecursively(dir: string, assetPath: string | undefined): Promise<string | null> {
  if (!assetPath) return null;

  const fileName = path.basename(assetPath);
  const pattern = `**/${fileName}`;

  try {
    const matchedFiles = await glob(pattern, { 
      cwd: dir, 
      absolute: true,
      windowsPathsNoEscape: true 
    });

    if (matchedFiles && matchedFiles.length > 0 && matchedFiles[0]) {
      return path.normalize(matchedFiles[0]);
    }

    return null;
  } catch (error) {
    return null;
  }
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