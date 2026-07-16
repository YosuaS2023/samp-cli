import { select, input, confirm } from '@inquirer/prompts';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

import { Lockfile } from '../utils/lockfile.js';
import { ProjectConfig } from '../config/ProjectConfig.js';

export default async function initAction(): Promise<void> {
    console.log('=== Selamat Datang di SA-MP CLI Init ===\n');

    try {
        const tipeProject = await select({
            message: 'Pilih jenis project:',
            choices: [
                { name: 'Gamemode', value: 'Gamemode' },
                { name: 'Library', value: 'Library' },
            ],
        });

        const namaProject = await input({
            message: 'Nama project kamu:',
            default: 'my-samp-project',
        });

    const inginGit = await confirm({
      message: 'Apakah nantinya ingin di-post di Git?',
      default: true
    });

    let gitUser = "";
    let gitRepo = "";

    if (inginGit) {
      gitUser = await input({ message: 'Masukkan nama user GitHub/Git kamu:' });
      gitRepo = await input({ message: 'Masukkan nama repository kamu:', default: namaProject });
    } else {
      gitUser = os.userInfo().username;
      gitRepo = namaProject;
    }

    console.log("\n-----------------------------------");
    console.log("Membuat file konfigurasi...");
    
    const myLockfile = new Lockfile("1.0.0");
    const projectKey = `github.com/${gitUser}/${gitRepo}`;
    
    myLockfile.addDependency(projectKey, {
        constraint: ":latest",
        resolved: "HEAD",
        user: gitUser,
        repo: gitRepo
    });

    await myLockfile.saveToFile('./pawn.lock');

    const config = new ProjectConfig();

    config.save({
        user: gitUser,
        repo: gitRepo,
        entry: "main.pwn",
        output: "gamemodes/main.amx",
        build: {
          compiler: { preset: "3.10.10" }
        },
        dependencies: []
    });

    if (tipeProject === 'Gamemode') {
      console.log("Membuat struktur folder SA-MP Legacy");
      
      const folders = ['filterscripts', 'gamemodes', 'logs', 'scriptfiles', 'npcmodes', 'plugins'];
      
      folders.forEach(folder => {
        const dirPath = path.join(process.cwd(), folder);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      });
    }

    console.log(`\nBerhasil menginisialisasi project ${tipeProject} (${namaProject})!`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('\nProses init dibatalkan.', errorMessage);
  }
}