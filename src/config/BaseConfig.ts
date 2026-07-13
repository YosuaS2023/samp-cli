import fs from "fs-extra";

export abstract class Config<T> {
    constructor(protected readonly file: string) {}

    exists(): boolean {
        return fs.existsSync(this.file);
    }

    read(): T | null {
        if (!this.exists()) {
            return null;
        }

        try {
            return fs.readJsonSync(this.file) as T;
        } catch {
            return null;
        }
    }

    write(data: T): boolean {
        try {
            fs.outputJsonSync(this.file, data, {
                spaces: 4,
            });

            return true;
        } catch {
            return false;
        }
    }
}