import type { DependencyInfo } from '../types/dependency.js'; // Sesuaikan path sesuai struktur folder Anda

export const parseDependency = (dependencyString: string): DependencyInfo => {
  let scheme = 'regular';
  let remaining = dependencyString;

  if (remaining.includes('://')) {
    // destructuring langsung dari array hasil split
    const [sc, rem] = remaining.split('://');
    scheme = sc ?? 'regular';
    remaining = rem ?? '';
  }

  // Kita gunakan '??' (nullish coalescing) untuk berjaga-jaga jika split gagal
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