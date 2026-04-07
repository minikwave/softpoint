import { Link, NavLink } from 'react-router-dom';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="site-header-brand">
          쌓음
        </Link>
        <nav className="site-header-nav" aria-label="사이트">
          <NavLink
            to="/product"
            className={({ isActive }) => `site-header-link${isActive ? ' active' : ''}`}
          >
            제품
          </NavLink>
          <NavLink
            to="/developers"
            className={({ isActive }) => `site-header-link${isActive ? ' active' : ''}`}
          >
            개발자
          </NavLink>
          <Link to="/app" className="site-header-cta">
            디앱
          </Link>
        </nav>
      </div>
    </header>
  );
}
