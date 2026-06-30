import { Link } from 'react-router-dom';
import { repoBlob } from '../config/repo';

export default function Product() {
  return (
    <main className="marketing-main">
      <h1 className="marketing-h1">SoftPoint 제품</h1>
      <p className="marketing-lead">
        <strong>SoftPoint</strong>는 소비·적립·교환 크레딧을 다루는 <strong>프로그래머블 크레딧 엔진</strong>입니다.
        지갑·거래소 UI가 아니라, 정책·원장·영수증·감사로 흐름을 추적하는 백엔드 제품이며
        소비자 디앱과 REST API로 다른 서비스에 결합할 수 있습니다.
      </p>

      <h2 className="marketing-h2">구성</h2>
      <ul className="marketing-list">
        <li><strong>Engine API</strong> — Fastify, Prisma(Postgres), `/v1/paypoint/*`, `/v1/admin/*`</li>
        <li><strong>Consumer D-App</strong> — 잔액·내역·적립·상품권·결제·가게 (마케팅 사이트와 분리)</li>
        <li><strong>Operator Console</strong> — 정책·예외·전환·영수증·준비금·감사</li>
        <li><strong>@softpoint/domain</strong> — 불변식·적립 계산 등 순수 도메인 로직</li>
      </ul>

      <h2 className="marketing-h2">v1 데모 시나리오</h2>
      <p className="marketing-p">
        10,000P 보유 → 5,000P 기프티콘 교환 → Receipt/Ledger 타임라인 → 운영 콘솔에서 영수증·준비금 확인.
      </p>

      <h2 className="marketing-h2">로드맵 (요약)</h2>
      <ul className="marketing-list marketing-list-muted">
        <li>EventOutbox, SettlementAdapter, reconciliation-worker</li>
        <li>실 PG·상품권 공급사 연동, merchant-console</li>
        <li>프로덕션 JWT·Admin RBAC·대사 인프라</li>
      </ul>

      <div className="marketing-actions">
        <Link to="/app" className="landing-btn landing-btn-primary">
          디앱 열기
        </Link>
        <a href={repoBlob('docs/ROADMAP_FROM_DEV_DOCS_2.md')} className="landing-btn landing-btn-secondary" target="_blank" rel="noreferrer">
          로드맵 문서
        </a>
      </div>
    </main>
  );
}
