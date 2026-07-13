export interface PawnConfig {
  resources?: {
    platform: 'windows' | 'linux';
    name: string;
    plugins?: string[];
    components?: string[];
    filterscripts?: string[];
    files?: Record<string, string>;
  }[];
}