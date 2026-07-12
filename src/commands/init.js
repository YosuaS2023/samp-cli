const { select, input, confirm } = require('@inquirer/prompts');
const os = require('os');
const Lockfile = require('../utils/lockfile');

async function initAction() {
  console.log("=== Selamat Datang di SA-MP CLI Init ===\n");

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
      default: 'my-samp-project'
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

    console.log(`\nBerhasil menginisialisasi project ${tipeProject} (${namaProject})!`);

  } catch (error) {
    console.log('\nProses init dibatalkan.');
  }
}

module.exports = initAction;