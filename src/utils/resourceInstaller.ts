import path from 'path';
import fs from 'fs-extra';
import fg from 'fast-glob';

import { installFile, installFolder } from './archive.js';
import type { DependencyResource } from '../types/dependency.js';

export async function installResources(
    extractDir: string,
    resource: DependencyResource
) {
    const files = await fg('**/*', {
        cwd: extractDir,
        dot: true,
        onlyFiles: false
    });

    await installFolder(files, extractDir, resource.includes, 'pawno/include');
    await installFile(files, extractDir, resource.plugins, 'plugins');
    await installFile(files, extractDir, resource.components, 'components');
    await installFile(files, extractDir, resource.filterscripts, 'filterscripts');
    await installFile(files, extractDir, resource.gamemodes, 'gamemodes');

    if (resource.files) {
        for (const [regex, output] of Object.entries(resource.files)) {
            const reg = new RegExp(regex);

            const match = files.find(f => reg.test(f));

            if (!match)
                continue;

            await fs.ensureDir(path.dirname(output));

            await fs.copy(
                path.join(extractDir, match),
                output
            );
        }
    }
}