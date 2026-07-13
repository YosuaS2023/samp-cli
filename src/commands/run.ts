const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const pc = require('picocolors');
const glob = require('glob'); // install via 'npm install glob' jika belum ada
const { configUtil } = require('../utils/config');

/**
 * Membersihkan file biner lama (.dll, .so) atau symlink yang rusak 
 * di folder tujuan plugin sebelum proses download dimulai.
 */
function cleanupPlugins() {
    const globalPluginTarget = path.join(process.cwd(), 'plugins');

    try {
        if (fs.existsSync(globalPluginTarget)) {
            const files = fs.readdirSync(globalPluginTarget);
            
            files.forEach(file => {
                const filePath = path.join(globalPluginTarget, file);
                const ext = path.extname(file).toLowerCase();
                const lstat = fs.lstatSync(filePath);

                if (lstat.isSymbolicLink()) {
                    fs.unlinkSync(filePath);
                    console.log(pc.gray(`[log]Symlink dibersihkan: ${file}`));
                } 
                else if (ext === '.dll' || ext === '.so') {
                    fs.removeSync(filePath);
                    console.log(pc.gray(`[log]: Plugin lama dihapus: ${file}`));
                }
            });
        }
    } catch (error) {
        console.log(pc.yellow(`[Warning] cleanup: Beberapa plugin mungkin sedang terkunci/digunakan oleh server.`));
    }
}

async function setupPluginsBeforeRun() {
    const depsPath = path.join(process.cwd(), 'dependencies');
    const localPluginsDir = path.join(process.cwd(), 'plugins');
    await fs.ensureDir(localPluginsDir);

    if (fs.existsSync(depsPath)) {
        const pluginFiles = glob.sync('dependencies/*/*/plugins/*.{dll,so}');
        
        for (const pluginFile of pluginFiles) {
            const fileName = path.basename(pluginFile);
            const targetPath = path.join(localPluginsDir, fileName);
            const absoluteSrcPath = path.resolve(pluginFile);

            let exists = false;
            try {
                const stat = await fs.lstat(targetPath); // Async
                exists = true;

                if (stat.isSymbolicLink()) {
                    await fs.unlink(targetPath); // Async
                    exists = false; 
                }
            } catch (err) {
                exists = false;
            }

            if (!exists) {
                try {
                    fs.symlinkSync(absoluteSrcPath, targetPath, 'file');
                    console.log(`🔗 Symlink dibuat: ${fileName}`);
                } catch (err) {
                    if (err.code === 'EPERM') {
                        try {
                            await fs.copyFile(absoluteSrcPath, targetPath);
                            console.log(`📋 Fallback Copy selesai (Async): ${fileName}`);
                        } catch (copyErr) {
                            console.error(`✖ Gagal mengopi file ${fileName}:`, copyErr.message);
                        }
                    } else {
                        console.error(`✖ Gagal memproses ${fileName}:`, err.message);
                    }
                }
            }
        }
    }
}

async function runAction(filename) {
    const currentDir = process.cwd();
    const config = configUtil.read();

    const serverCfgPath = path.join(currentDir, 'server.cfg');
    const ompConfigPath = path.join(currentDir, 'config.json');

    if (!fs.existsSync(configPath)) {
        console.log(pc.red('\n✖ Error: File "samp.config.json" tidak ditemukan!'));
        return;
    }

    const isOMP = fs.existsSync(ompConfigPath);
    const serverType = isOMP ? 'open.mp' : 'SA-MP';
    
    const cliBinDir = path.join(__dirname, '../', '../', 'bin');
    const isWindows = process.platform === 'win32';
    const serverExeName = isOMP 
        ? (isWindows ? 'omp-server.exe' : 'omp-server')
        : (isWindows ? 'samp-server.exe' : 'samp-server');
    const serverExePath = path.join(cliBinDir, serverExeName);

    if (!fs.existsSync(serverExePath)) {
        console.log(pc.red(`\n✖ Error: Biner '${serverExeName}' tidak ditemukan di ${cliBinDir}`));
        return;
      }

    if (filename) {
      const gamemodeName = path.basename(filename, '.pwn');
        if (isOMP) {
            let ompConfig = JSON.parse(fs.readFileSync(ompConfigPath, 'utf-8'));
            ompConfig.pawn = ompConfig.pawn || {};
            ompConfig.pawn.main_scripts = [gamemodeName];
            fs.writeFileSync(ompConfigPath, JSON.stringify(ompConfig, null, 4));
        } else if (fs.existsSync(serverCfgPath)) {
            let cfgContent = fs.readFileSync(serverCfgPath, 'utf-8');
            fs.writeFileSync(serverCfgPath, cfgContent);
        }
    }

    console.log(pc.cyan(`\n========== 🎮 MENGHIDUPKAN SERVER (${serverType}) ==========`));
    
    const serverProcess = spawn(serverExePath, [], {
        cwd: currentDir,
        stdio: 'inherit'
    });

    serverProcess.on('close', (code) => {
        console.log(pc.yellow(`\nℹ Server dihentikan (Exit Code: ${code}).`));
        cleanupPlugins(); 
    });
}

module.exports = { runAction };