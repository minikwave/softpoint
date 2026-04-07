import SiteHeader from '../components/SiteHeader';
import { Link } from 'react-router-dom';
import { repoBlob } from '../config/repo';

export default function Product() {
  return (
    <div className="marketing-layout">
      <SiteHeader />
      <main className="marketing-main">
        <h1 className="marketing-h1">제품 · 쌓음과 PayPoint</h1>
        <p className="marketing-lead">
          <strong>쌓음</strong>은 사용자에게 보이는 앱 브랜드이고, <strong>PayPoint</strong>는 잔액·적립·결제·정책을 담는{' '}
          <strong>크레딧 엔진(SSOT)</strong> 레이어입니다. 스테이블코인·은행 예금과 별개인{' '}
          <strong>소비용 크레딧</strong> 모델을 전제로 합니다.
        </p>

        <h2 className="marketing-h2">개발 현황 (2026년 4월 · MVP 데모)</h2>
        <ul className="marketing-list">
          <li>랜딩과 디앱 분리: 잔액, 내역, 적립 내역·출처 필터, 적립 장소(API), 상품권·결제·정산 옵션, 가맹 데모</li>
          <li>REST API: Issue / Spend / Balance / Transactions, 전환 요청·조회, 멱등 키(경로별)</li>
          <li>운영: 정책 초안→활성화, 예외 큐, 전환 승인·정산·실패, 감사 로그, 선택적 Admin 키·사용자 JWT</li>
          <li>선택적 <strong>Prometheus</strong>: 환경 변수로 켤 때 <code className="inline-code">GET /metrics</code></li>
        </ul>

        <h2 className="marketing-h2">의도된 한계 (문서 기준)</h2>
        <ul className="marketing-list marketing-list-muted">
          <li>콘솔 RBAC·2인 승인 없음 · 멱등 키 전 쓰기 강제는 미적용</li>
          <li>전환 라우터 실연동(DEX/CEX), PCI 충전, 마켓플레이스·상품권 재고 API 미구현</li>
          <li>
            은행·온체인·PG 잔고와 포인트 부채를 맞추는 <strong>대사·모니터링 인프라</strong>는 레포에 없음(
            <a href={repoBlob('docs/MVP_REMAINING_AND_RECONCILIATION.md')} target="_blank" rel="noreferrer">
              정리 문서
            </a>
            )
          </li>
        </ul>

        <h2 className="marketing-h2">로드맵 방향</h2>
        <p className="marketing-p">
          전환 Quote·라우터, 포인트 상품권·PCI 충전, 수집품, 포인트앱형 허브 UX, 워커·모바일 셸, 텔레그램 등은{' '}
          <a href={repoBlob('PROJECT_ANALYSIS_AND_PLAN.md')} target="_blank" rel="noreferrer">
            실행 계획 §5·§10
          </a>
          에 ID로 추적합니다.
        </p>

        <div className="marketing-actions">
          <Link to="/app" className="landing-btn landing-btn-primary">
            디앱 들어가기
          </Link>
          <Link to="/developers" className="landing-btn landing-btn-secondary">
            개발자 문서
          </Link>
        </div>
      </main>
    </div>
  );
}
