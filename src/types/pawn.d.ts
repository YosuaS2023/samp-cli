export interface Resource {
    name: string;
    platform: 'windows' | 'linux';
    archive?: boolean;

    includes?: string[];
    plugins?: string[];
    components?: string[];
    filterscripts?: string[];

    files?: Record<string, string>;
}

export interface Runtime {
    plugins?: string[];
    components?: string[];
    filterscripts?: string[];
}

export interface ProjectPawnConfig {
    user: string;
    repo: string;
    entry: string;
    output: string;

    dependencies: string[] | Record<string, string>;
}

export interface DependencyPawnConfig {
    user: string;
    repo: string;

    resources?: Resource[];
    runtime?: Runtime;
    contributors?: string[];
}