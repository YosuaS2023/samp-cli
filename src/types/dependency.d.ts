export interface DependencyInfo {
  scheme: string;
  user: string;
  repo: string;
  repoPath: string;
  version: string;
}

export interface DependencyResource {
  name: string;
  platform: 'windows' | 'linux';
  archive?: boolean;

  includes?: string[];
  plugins?: string[];
  components?: string[];
  filterscripts?: string[];
  gamemodes?: string[];

  files?: Record<string, string>;
}