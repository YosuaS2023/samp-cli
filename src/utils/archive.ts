import path from 'path';
import fs from 'fs-extra';

export async function installFolder(
    files: string[],
    cwd: string,
    rules: string[] | undefined,
    destination: string
) {
    if (!rules) return;

    for (const regex of rules) {
        const reg = new RegExp(regex);

        const match = files.find(f => reg.test(f));

        if (!match)
            continue;

        await fs.copy(
            path.join(cwd, match),
            destination,
            { overwrite: true }
        );
    }
}

export async function installFile(
    files: string[],
    cwd: string,
    rules: string[] | undefined,
    destination: string
) {
    if (!rules) return;

    await fs.ensureDir(destination);

    for (const regex of rules) {
        const reg = new RegExp(regex);

        const match = files.find(f => reg.test(f));

        if (!match)
            continue;

        await fs.copy(
            path.join(cwd, match),
            path.join(destination, path.basename(match)),
            { overwrite: true }
        );
    }
}