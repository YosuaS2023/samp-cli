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

export const resolveIncludes = (filePath: string, visitedFiles = new Set<string>()): string => {
    const absolutePath = path.resolve(filePath);
    
    // Cegah circular include (file include muter-muter tanpa henti)
    if (visitedFiles.has(absolutePath)) return "";
    visitedFiles.add(absolutePath);

    if (!fs.existsSync(absolutePath)) {
        console.warn(`[WARNING] File include tidak ditemukan: ${filePath}`);
        return "";
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    
    // Regex sederhana untuk mencari #include "filename" atau #include <filename>
    const includeRegex = /#include\s+["<]([^">]+)[">]/g;

    return content.replace(includeRegex, (match, includePath) => {
        // Tentukan lokasi file include relatif terhadap file yang sedang dibaca
        const dir = path.dirname(absolutePath);
        let fullIncludePath = path.join(dir, includePath);

        // Jika tidak ketemu langsung, coba tambahkan extension .pwn atau .inc jika belum ada
        if (!fs.existsSync(fullIncludePath)) {
            if (fs.existsSync(fullIncludePath + ".pwn")) fullIncludePath += ".pwn";
            else if (fs.existsSync(fullIncludePath + ".inc")) fullIncludePath += ".inc";
        }

        // Rekursif: Baca isi file include tersebut
        return resolveIncludes(fullIncludePath, visitedFiles);
    });
}