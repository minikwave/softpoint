import SiteHeader from '../components/SiteHeader';
import { repoBlob, repoRoot } from '../config/repo';

const API_URL = import.meta.env.VITE_API_URL || '/v1';

export default function Developers() {
  return (
    <div className="marketing-layout">
      <SiteHeader />
      <main className="marketing-main">
        <h1 className="marketing-h1">개발자 문서</h1>
        <p className="marketing-lead">
          이 페이지는 레포의 <strong>문서·API 계약</strong>으로 이어지는 안내입니다. 브랜드 전제: 사용자 앱{' '}
          <strong>쌓음</strong> / 슬러그 <strong>saum</strong>, 엔진 <strong>PayPoint</strong> (
          <a href={repoBlob('docs/PRODUCT_NAMING.md')} target="_blank" rel="noreferrer">
            명칭 정리
          </a>
          ).
        </p>

        <h2 className="marketing-h2">저장소</h2>
        <p className="marketing-p">
          소스·이슈:{' '}
          <a href={repoRoot()} target="_blank" rel="noreferrer">
            {repoRoot()}
          </a>
          <br />
          다른 원격을 쓰는 경우 빌드 시 <code className="inline-code">VITE_REPO_URL</code>을 설정하세요.
        </p>

        <h2 className="marketing-h2">빠른 시작 (로컬)</h2>
        <pre className="code-block">
          <code>{`pnpm install
cp .env.example .env   # DATABASE_URL 등
pnpm db:push && pnpm db:seed   # 선택
pnpm dev              # API :3000
pnpm dev:webapp       # 쌓음 웹 :5173 → 프록시 /v1`}</code>
        </pre>

        <h2 className="marketing-h2">API</h2>
        <ul className="marketing-list">
          <li>
            베이스 URL(웹앱): <code className="inline-code">{API_URL}</code> — 프로덕션은{' '}
            <code className="inline-code">VITE_API_URL</code>로 지정
          </li>
          <li>
            <a href={repoBlob('docs/openapi.yaml')} target="_blank" rel="noreferrer">
              OpenAPI 3 스펙 (openapi.yaml)
            </a>{' '}
            — Swagger Editor 등에 임포트
          </li>
          <li>
            <code className="inline-code">GET /health</code> — 생존 확인
          </li>
          <li>
            <code className="inline-code">GET /metrics</code> —{' '}
            <code className="inline-code">ENABLE_PROMETHEUS_METRICS=true</code> 일 때만 등록
          </li>
          <li>
            사용자 API: <code className="inline-code">USER_JWT_SECRET</code> 설정 시 Bearer JWT,{' '}
            <code className="inline-code">sub</code> = <code className="inline-code">user_id</code>
          </li>
          <li>
            Admin API: <code className="inline-code">ADMIN_API_KEY</code> →{' '}
            <code className="inline-code">x-admin-api-key</code> 또는 Bearer
          </li>
        </ul>

        <h2 className="marketing-h2">문서 목록</h2>
        <ul className="doc-link-list">
          <li>
            <a href={repoBlob('README.md')} target="_blank" rel="noreferrer">
              README
            </a>{' '}
            — 설치, 멱등, 환경 변수
          </li>
          <li>
            <a href={repoBlob('docs/CURRENT_STATE_UX_AND_FUTURE_FLOWS.md')} target="_blank" rel="noreferrer">
              현재 구조·UX·추후 플로우
            </a>
          </li>
          <li>
            <a href={repoBlob('docs/MVP_REMAINING_AND_RECONCILIATION.md')} target="_blank" rel="noreferrer">
              MVP 잔여 · 대사/모니터링 현황
            </a>
          </li>
          <li>
            <a href={repoBlob('docs/POSTGRES_TRANSACTION_OPS.md')} target="_blank" rel="noreferrer">
              PostgreSQL 트랜잭션·락
            </a>
          </li>
          <li>
            <a href={repoBlob('docs/PAYPOINT_EARN_POLICY_AND_FLOW.md')} target="_blank" rel="noreferrer">
              적립 정책·결제 시 적립
            </a>
          </li>
          <li>
            <a href={repoBlob('paypoint dev docs.txt')} target="_blank" rel="noreferrer">
              PayPoint 개발자 문서 (장문, v1 초안)
            </a>
          </li>
          <li>
            <a href={repoBlob('AGENTS.md')} target="_blank" rel="noreferrer">
              AGENTS.md
            </a>{' '}
            — 협업 시 브랜드 전제 한 줄
          </li>
        </ul>

        <h2 className="marketing-h2">오퍼레이터 콘솔</h2>
        <p className="marketing-p">
          별도 Vite 앱 <code className="inline-code">apps/operator-console</code>. 로컬{' '}
          <code className="inline-code">pnpm dev:console</code> → 기본{' '}
          <a href="http://localhost:5174" target="_blank" rel="noreferrer">
            :5174
          </a>
        </p>
      </main>
    </div>
  );
}
