const fs = require('fs').promises;

class Lockfile {
  constructor(sampctlVersion) {
    this.version = 1;
    this.generated = new Date().toISOString();
    this.sampctl_version = sampctlVersion;
    this.dependencies = {};
    this.runtime = null;
  }

  // Fungsi untuk menambah dependency baru
  addDependency(key, depData) {
    this.dependencies[key] = {
      constraint: depData.constraint || "",
      resolved: depData.resolved || "",
      commit: depData.commit || "",
      site: depData.site || "github.com",
      user: depData.user,
      repo: depData.repo
    };
  }

  // Fungsi untuk mengatur runtime info
  setRuntime(version, platform, files = []) {
    this.runtime = {
      version: version,
      platform: platform,
      files: files
    };
  }

  // Fungsi untuk menyimpan object ini menjadi file JSON (pawn.lock)
  async saveToFile(filePath) {
    try {
      this.generated = new Date().toISOString(); 
      const jsonString = JSON.stringify(this, null, 2);
      await fs.writeFile(filePath, jsonString, 'utf8');
      console.log(`Berhasil membuat file lock di: ${filePath}`);
    } catch (error) {
      console.error("Gagal menyimpan file lock:", error);
    }
  }
}

module.exports = Lockfile;