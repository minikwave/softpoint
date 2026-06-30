import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n/context';

const items = [
  { to: '/app/home', labelKey: 'nav.home', icon: '⌂' },
  { to: '/app/earn', labelKey: 'nav.earn', icon: '✦' },
  { to: '/app/vouchers', labelKey: 'nav.shop', icon: '◇' },
  { to: '/app/spend', labelKey: 'nav.pay', icon: '→' },
  { to: '/app/more', labelKey: 'nav.more', icon: '⋯' },
] as const;

export default function DAppBottomNav() {
  const { t } = useI18n();

  return (
    <nav className="dapp-bottom-nav" aria-label={t('brand.dapp')}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `dapp-bottom-link${isActive ? ' active' : ''}`}
        >
          <span className="dapp-bottom-icon" aria-hidden>{item.icon}</span>
          <span className="dapp-bottom-label">{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
