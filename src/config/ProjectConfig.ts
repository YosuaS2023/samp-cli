import path from "path";

import { logger } from "../utils/logger.js";
import { Config } from "./BaseConfig.js";
import type { ProjectPawnConfig,BuildConfig } from "../types/pawn.js";

const CONFIG_FILE = "pawn.json";

type PawnConstants = Pick<BuildConfig, 'constants'>;

export class ProjectConfig extends Config<ProjectPawnConfig> {

  constructor() {
    super(path.join(process.cwd(), CONFIG_FILE));
  }

  load(): ProjectPawnConfig | null {
    return this.read();
  }

  save(data: ProjectPawnConfig): boolean {
    return this.write(data);
  }

  addDependency(dep: string): boolean {
    const config = this.load();

    if (!config) {
      return false;
    }

    if (Array.isArray(config.dependencies)) {

      if (config.dependencies.includes(dep)) {
        return true;
      }

      config.dependencies.push(dep);

    } else {

      const [repo, version] = dep.split(":");

      if (!repo) {
        logger.error("Dependency tidak valid.");
        return false;
      }
      config.dependencies[repo] = version ?? "latest";
    }

    return this.save(config);
  }

  removeDependency(dep: string): boolean {
    const config = this.load();

    if (!config) {
      return false;
    }

    if (Array.isArray(config.dependencies)) {

      config.dependencies = config.dependencies.filter(
        d => d !== dep
      );

    } else {
      delete config.dependencies[dep];
    }

    return this.save(config);
  }

  hasDependency(dep: string): boolean {
    const config = this.load();

    if (!config) {
      return false;
    }

    if (Array.isArray(config.dependencies)) {
      return config.dependencies.includes(dep);
    }

    return dep in config.dependencies;
  }

  getDependencies(): string[] {
    const config = this.load();

    if (!config) {
      return [];
    }

    if (Array.isArray(config.dependencies)) {
      return config.dependencies;
    }

    return Object.entries(config.dependencies).map(
      ([repo, version]) =>
        version === "latest"
          ? repo
        : `${repo}:${version}`
    );
  }

  loadConstants(): PawnConstants {
    const config = this.load();

    const defaultConfig: PawnConstants = {
      constants: {
        "MAX_PLAYERS": 500,
        "MAX_VEHICLES": 2000
      }
    };

    if (!config) {
      return defaultConfig;
    }

    return {
      constants: {
        ...defaultConfig.constants,
        ...(config.build?.constants || {})
      }
    };
  }
}