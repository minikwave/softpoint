import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-inner">
        <h1 className="landing-title">쌓음</h1>
        <p className="landing-subtitle">PayPoint · 소비 크레딧</p>
        <p className="landing-desc">
          적립하고, 사용하고, 정산하는. 자산이 아닌 경험을 위한 크레딧입니다.
        </p>
        <div className="landing-actions">
          <Link to="/app" className="landing-btn landing-btn-primary">
            디앱 들어가기
          </Link>
          <Link to="/app/store" className="landing-btn landing-btn-secondary">
            가게 관리
          </Link>
        </div>
        <p className="landing-admin">
          관리자 콘솔은 별도 주소에서 이용 가능합니다. (Operator Console)
        </p>
      </div>
    </div>
  );
}
