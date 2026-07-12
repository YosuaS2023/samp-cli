const fs = require('fs-extra');
const path = require('path');
const { logger } = require('./logger');

const CONFIG_FILE = 'pawn.json';

const configUtil = {
  getConfigPath: () => path.join(process.cwd(), CONFIG_FILE),

  exists: () => {
    return fs.existsSync(configUtil.getConfigPath());
  },

  read: () => {
    if (!configUtil.exists()) {
      logger.error(`${CONFIG_FILE} tidak ditemukan di folder ini!`);
      return null;
    }
    try {
      return fs.readJsonSync(configUtil.getConfigPath());
    } catch (err) {
      logger.error(`Gagal membaca atau memproses ${CONFIG_FILE}: ${err.message}`);
      return null;
    }
  },

  write: (data) => {
    try {
      fs.outputJsonSync(configUtil.getConfigPath(), data, { spaces: 2 });
      logger.success(`${CONFIG_FILE} berhasil disimpan/diperbarui.`);
      return true;
    } catch (err) {
      logger.error(`Gagal menulis ke ${CONFIG_FILE}: ${err.message}`);
      return false;
    }
  },

  addDependency: (newDep) => {
    const config = configUtil.read() || {};
    
    if (!config.dependencies) {
      config.dependencies = [];
    }

    if (Array.isArray(config.dependencies)) {
      if (config.dependencies.includes(newDep)) {
        logger.warn(`Dependensi "${newDep}" sudah ada di pawn.json.`);
        return true;
      }
      config.dependencies.push(newDep);
    } 
    else if (typeof config.dependencies === 'object') {
      let [repoPath, version] = newDep.split(':');
      config.dependencies[repoPath] = version || 'latest';
    }

    return configUtil.write(config);
  },

  getDependencies: () => {
    const config = configUtil.read();
    if (!config || !config.dependencies) return [];

    // ["user/repo", "user/repo:version"]
    if (Array.isArray(config.dependencies)) {
      return config.dependencies;
    }

    // { "user/repo": "version", "user/repo2": "latest" }
    if (typeof config.dependencies === 'object' && config.dependencies !== null) {
      return Object.entries(config.dependencies).map(([repo, version]) => {
        if (!version || version === 'latest' || version === '*') {
          return repo;
        }
        return `${repo}:${version}`;
      });
    }

    return [];
  }
};

module.exports = { configUtil };