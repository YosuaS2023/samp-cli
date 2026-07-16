export interface Resource {
  name: string;
  platform: 'windows' | 'linux';
  archive?: boolean;

  includes?: string[];
  plugins?: string[];
  components?: string[];
  filterscripts?: string[];

  files?: Record<string, string>;
};

export interface Runtime {
  plugins?: string[];
  components?: string[];
  filterscripts?: string[];
};

export interface CompilerConfig {
  preset: string;
};

export interface BuildConfig {
  compiler: CompilerConfig;
};

export interface ProjectPawnConfig {
  user: string;
  repo: string;
  entry: string;
  output: string;
  build: BuildConfig;
  dependencies: string[] | Record<string, string>;
};

export interface DependencyPawnConfig {
  user: string;
  repo: string;

  resources?: Resource[];
  runtime?: Runtime;
  contributors?: string[];
};

export interface ArrayWarning {
  line: number;
  variableName: string;
  accessedIndex: number;
  limitSize: number;
  message: string;
}

export interface VerifyResult {
  warnings: ArrayWarning[];
  isClean: boolean;
}