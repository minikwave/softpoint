import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';

export default function Landing() {
  return (
    <div className="landing-page">
      <SiteHeader />
      <div className="landing">
        <div className="landing-inner">
          <header>
            <h1 className="landing-title">쌓음</h1>
            <p className="landing-subtitle">PayPoint · 소비 크레딧</p>
          </header>
          <p className="landing-status" role="status">
            <span className="landing-status-pill">MVP 데모</span>
            <span className="landing-status-text">
              잔액·적립·결제·정산 옵션·운영 콘솔까지 연결된 프로토타입 (2026년 4월 기준)
            </span>
          </p>
          <p className="landing-desc">
            결제·이벤트·가맹 혜택에서 쌓인 가치를 한곳의 크레딧으로 모읍니다. 쓰고, 필요하면 정산까지.
            자산이 아닌 소비 경험을 위한 레이어입니다. 앱 이름은 <strong>쌓음</strong>, 엔진·단위는{' '}
            <strong>PayPoint</strong>입니다.
          </p>
          <div className="landing-actions">
            <Link to="/app" className="landing-btn landing-btn-primary">
              디앱 들어가기
            </Link>
            <Link to="/app/store" className="landing-btn landing-btn-secondary">
              가게 관리
            </Link>
          </div>
          <div className="landing-links-row">
            <Link to="/product" className="landing-text-link">
              제품 현황
            </Link>
            <span className="landing-links-sep" aria-hidden>
              ·
            </span>
            <Link to="/developers" className="landing-text-link">
              개발자 문서
            </Link>
          </div>
          <p className="landing-hint">
            디앱·가게 화면에서는 상단 메뉴로 잔액·내역·정산 등을 이용할 수 있습니다. PCI 충전·은행/온체인
            대사 등은 아직 제품 로드맵 단계입니다.
          </p>
          <p className="landing-admin">
            관리자 콘솔은 별도 앱·포트에서 실행합니다. (<code className="inline-code">pnpm dev:console</code>)
          </p>
        </div>
      </div>
    </div>
  );
}
