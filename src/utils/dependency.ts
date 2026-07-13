import type { DependencyInfo } from '../types/dependency.js';

export const parseDependency = (dependencyString: string): DependencyInfo => {
  let scheme = 'regular';
  let remaining = dependencyString;

  if (remaining.includes('://')) {
    const [sc, rem] = remaining.split('://');
    scheme = sc ?? 'regular';
    remaining = rem ?? '';
  }

  const [repoPath = '', version = 'latest'] = remaining.split(':');
  const [user = '', repo = ''] = repoPath.split('/');

  return {
    scheme: scheme.toLowerCase(),
    user,
    repo,
    repoPath,
    version
  };
};