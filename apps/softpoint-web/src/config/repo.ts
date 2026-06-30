const DEFAULT_REPO_ROOT = 'https://github.com/minikwave/softpoint';

export function repoRoot(): string {
  const u = import.meta.env.VITE_REPO_URL?.trim();
  return u && u.length > 0 ? u.replace(/\/$/, '') : DEFAULT_REPO_ROOT;
}

export function repoBlob(relativePath: string): string {
  const p = relativePath.replace(/^\//, '');
  const encoded = p.split('/').map((s) => encodeURIComponent(s)).join('/');
  return `${repoRoot()}/blob/main/${encoded}`;
}
