import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <main className="landing-hero">
      <div className="landing-hero-glow" aria-hidden />
      <div className="landing-hero-inner">
        <p className="landing-eyebrow">Programmable Credit</p>
        <h1 className="landing-hero-title">
          적립·사용·교환을
          <br />
          <span className="landing-gradient">한 엔진</span>으로
        </h1>
        <p className="landing-hero-lead">
          SoftPoint는 원장·영수증·정책·감사로 크레딧 흐름을 추적하는 독립 프로덕트입니다.
          소비자 디앱과 REST API로 다른 제품에 임베드할 수 있습니다.
        </p>
        <div className="landing-hero-actions">
          <Link to="/app" className="landing-btn landing-btn-primary">
            디앱 열기
          </Link>
          <Link to="/developers" className="landing-btn landing-btn-secondary">
            API · 연동
          </Link>
        </div>
        <ul className="landing-features" aria-label="핵심 기능">
          <li>
            <strong>Ledger + Receipt</strong>
            <span>모든 발행·사용·교환의 SSOT</span>
          </li>
          <li>
            <strong>Policy-driven earn</strong>
            <span>결제 적립·한도·버전 정책</span>
          </li>
          <li>
            <strong>Operator-ready</strong>
            <span>대시보드·예외·감사·준비금</span>
          </li>
        </ul>
        <p className="landing-footnote">
          <Link to="/product">제품 개요</Link>
          {' · '}
          저장소{' '}
          <a href="https://github.com/minikwave/softpoint" target="_blank" rel="noreferrer">
            minikwave/softpoint
          </a>
        </p>
      </div>
    </main>
  );
}
