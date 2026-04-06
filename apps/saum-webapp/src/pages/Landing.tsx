import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-inner">
        <header>
          <h1 className="landing-title">쌓음</h1>
          <p className="landing-subtitle">PayPoint · 소비 크레딧</p>
        </header>
        <p className="landing-desc">
          결제·이벤트·가맹 혜택에서 쌓인 가치를 한곳의 크레딧으로 모읍니다. 쓰고, 필요하면 정산까지.
          자산이 아닌 소비 경험을 위한 레이어입니다.
        </p>
        <div className="landing-actions">
          <Link to="/app" className="landing-btn landing-btn-primary">
            디앱 들어가기
          </Link>
          <Link to="/app/store" className="landing-btn landing-btn-secondary">
            가게 관리
          </Link>
        </div>
        <p className="landing-hint">
          디앱·가게 화면에서는 상단 메뉴로 잔액·내역·정산 등을 이용할 수 있습니다.
        </p>
        <p className="landing-admin">
          관리자 콘솔은 별도 주소에서 이용 가능합니다. (Operator Console)
        </p>
      </div>
    </div>
  );
}
