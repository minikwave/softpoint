/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 프로덕션 API origin (예: https://xxx.up.railway.app). 비우면 상대 경로 /v1 (프록시) */
  readonly VITE_API_URL?: string;
  /** Dev only: HS256 JWT when API USER_JWT_SECRET is set; `sub` must match user_id in UI */
  readonly VITE_USER_JWT?: string;
  /** GitHub 등 레포 루트 URL (제품·개발자 페이지 문서 링크). 미설정 시 기본 원격 사용 */
  readonly VITE_REPO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
