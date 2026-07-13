// src/utils/lockfile.ts
import { writeFile } from 'node:fs/promises';

// Mendefinisikan tipe data untuk dependency
interface Dependency {
  constraint: string;
  resolved: string;
  commit: string;
  site: string;
  user: string;
  repo: string;
}

// Mendefinisikan tipe data untuk runtime
interface Runtime {
  version: string;
  platform: string;
  files: string[];
}

export class Lockfile {
  public version: number = 1;
  public generated: string;
  public sampctl_version: string;
  public dependencies: Record<string, Dependency> = {};
  public runtime: Runtime | null = null;

  constructor(sampctlVersion: string) {
    this.sampctl_version = sampctlVersion;
    this.generated = new Date().toISOString();
  }

  // Menambah dependency baru dengan tipe data yang jelas
  public addDependency(key: string, depData: Partial<Dependency> & { user: string; repo: string }): void {
    this.dependencies[key] = {
      constraint: depData.constraint || "",
      resolved: depData.resolved || "",
      commit: depData.commit || "",
      site: depData.site || "github.com",
      user: depData.user,
      repo: depData.repo
    };
  }

  // Mengatur runtime info
  public setRuntime(version: string, platform: string, files: string[] = []): void {
    this.runtime = {
      version,
      platform,
      files
    };
  }

  // Menyimpan object menjadi file JSON
  public async saveToFile(filePath: string): Promise<void> {
    try {
      this.generated = new Date().toISOString();
      const jsonString = JSON.stringify(this, null, 2);
      await writeFile(filePath, jsonString, 'utf8');
      console.log(`Berhasil membuat file lock di: ${filePath}`);
    } catch (error) {
      console.error("Gagal menyimpan file lock:", error);
      throw error; // Melempar error agar bisa ditangani pemanggilnya
    }
  }
}