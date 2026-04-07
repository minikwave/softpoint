/** GitHub(또는 미러) 루트. 배포 시 `VITE_REPO_URL`로 덮어쓸 수 있습니다. */
const DEFAULT_REPO_ROOT = 'https://github.com/ziptalk/pay-saum';

export function repoRoot(): string {
  const u = import.meta.env.VITE_REPO_URL?.trim();
  return u && u.length > 0 ? u.replace(/\/$/, '') : DEFAULT_REPO_ROOT;
}

/** `main` 브랜치 기준 원본 파일 링크 (공백 등은 세그먼트 단위 인코딩) */
export function repoBlob(relativePath: string): string {
  const p = relativePath.replace(/^\//, '');
  const encoded = p.split('/').map((s) => encodeURIComponent(s)).join('/');
  return `${repoRoot()}/blob/main/${encoded}`;
}
