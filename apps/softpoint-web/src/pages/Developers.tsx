import { repoBlob, repoRoot } from '../config/repo';

const API_PREFIX = import.meta.env.VITE_API_URL?.trim() || '(배포 시 Railway origin)';

export default function Developers() {
  return (
    <main className="marketing-main">
      <h1 className="marketing-h1">개발자 · 연동</h1>
      <p className="marketing-lead">
        SoftPoint는 <strong>REST API</strong>와 <strong>npm 워크스페이스 패키지</strong>로 다른 제품에 임베드할 수 있습니다.
        크레딧 SSOT는 엔진 DB이며, 클라이언트는 API만 호출합니다.
      </p>

      <h2 className="marketing-h2">저장소</h2>
      <p className="marketing-p">
        <a href={repoRoot()} target="_blank" rel="noreferrer">{repoRoot()}</a>
      </p>

      <h2 className="marketing-h2">배포 (프로덕션)</h2>
      <ul className="marketing-list">
        <li>API: Railway (Docker) — <code className="inline-code">GET /health</code></li>
        <li>Web: Vercel — <code className="inline-code">VITE_API_URL</code> = API origin</li>
        <li>DB: Supabase Postgres — Prisma 스키마</li>
      </ul>

      <h2 className="marketing-h2">API 베이스</h2>
      <p className="marketing-p">
        <code className="inline-code">{API_PREFIX}</code>
      </p>

      <h2 className="marketing-h2">주요 엔드포인트</h2>
      <ul className="marketing-list">
        <li><code className="inline-code">GET /v1/paypoint/balance/:user_id</code></li>
        <li><code className="inline-code">POST /v1/paypoint/spend</code> · <code className="inline-code">POST /v1/paypoint/issue</code></li>
        <li><code className="inline-code">GET /v1/paypoint/credits/products</code> · <code className="inline-code">POST /v1/paypoint/credits/redeem</code></li>
        <li><code className="inline-code">GET /v1/paypoint/receipts</code> · <code className="inline-code">GET /v1/paypoint/earn-locations</code></li>
        <li><code className="inline-code">GET /v1/admin/dashboard</code> (Admin API Key)</li>
      </ul>

      <h2 className="marketing-h2">인증</h2>
      <p className="marketing-p">
        <code className="inline-code">USER_JWT_SECRET</code> 설정 시 Bearer JWT 필수, <code className="inline-code">sub</code> = <code className="inline-code">user_id</code>.
        <code className="inline-code">ADMIN_API_KEY</code> 설정 시 운영 API 키 필수.
      </p>

      <h2 className="marketing-h2">문서</h2>
      <ul className="marketing-list">
        <li><a href={repoBlob('docs/DEPLOY.md')} target="_blank" rel="noreferrer">배포 가이드</a></li>
        <li><a href={repoBlob('docs/PAYPOINT_EARN_POLICY_AND_FLOW.md')} target="_blank" rel="noreferrer">적립 정책·플로우</a></li>
        <li><a href={repoBlob('README.md')} target="_blank" rel="noreferrer">README</a></li>
      </ul>
    </main>
  );
}
