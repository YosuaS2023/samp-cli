import fs from 'fs';
import path from 'path';

export const readFile = (filePath: string): string => {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File tidak ditemukan: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
};

export const writeFile = (filePath: string, content: string): void => {
  const fullPath = path.resolve(process.cwd(), filePath);
  fs.writeFileSync(fullPath, content, 'utf-8');
};