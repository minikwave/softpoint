/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** Dev only: HS256 JWT when API USER_JWT_SECRET is set; `sub` must match user_id in UI */
  readonly VITE_USER_JWT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
