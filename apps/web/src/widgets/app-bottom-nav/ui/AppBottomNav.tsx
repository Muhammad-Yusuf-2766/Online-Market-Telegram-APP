import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { Link, NavLink } from 'react-router-dom';
import { useAppSelector } from '../../../app/hooks';

export function AppBottomNav() {
  const { t } = useTranslation();
  const cartCount = useAppSelector((s) =>
    s.cart.items.reduce((n, l) => n + l.quantity, 0),
  );

  const left = [
    { to: '/', label: t('nav.home'), end: true, icon: IconHome },
    { to: '/cart', label: t('nav.cart'), end: false, icon: IconCart },
  ];
  const right = [
    { to: '/profile', label: t('nav.profile'), end: false, icon: IconUser },
    { to: '/orders', label: t('nav.orders'), end: false, icon: IconOrders },
  ];

  const nav = (
    <nav className="tma-bottom-nav" aria-label={t('nav.main')}>
      <div className="tma-bottom-nav__row">
        <div className="tma-bottom-nav__side">
          {left.map(({ to, label, end, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `tma-bottom-nav__item${isActive ? ' tma-bottom-nav__item--active' : ''}`
              }
            >
              <Icon className="tma-bottom-nav__icon" aria-hidden />
              <span className="tma-bottom-nav__label">{label}</span>
              {to === '/cart' && cartCount > 0 ? (
                <span className="tma-bottom-nav__badge">{cartCount > 99 ? '99+' : cartCount}</span>
              ) : null}
            </NavLink>
          ))}
        </div>
        <div className="tma-bottom-nav__fab-wrap">
          <Link to="/search" className="tma-bottom-nav__fab" aria-label={t('nav.search')}>
            <IconSearch className="tma-bottom-nav__fab-icon" aria-hidden />
          </Link>
        </div>
        <div className="tma-bottom-nav__side">
          {right.map(({ to, label, end, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `tma-bottom-nav__item${isActive ? ' tma-bottom-nav__item--active' : ''}`
              }
            >
              <Icon className="tma-bottom-nav__icon" aria-hidden />
              <span className="tma-bottom-nav__label">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );

  return typeof document !== 'undefined'
    ? createPortal(nav, document.body)
    : nav;
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCart({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 7h15l-1.5 9h-12L6 7Zm0 0L5 3H2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1.25" fill="currentColor" />
      <circle cx="17" cy="20" r="1.25" fill="currentColor" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5 20v-1c0-2.5 3-4 7-4s7 1.5 7 4v1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconOrders({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 6h13M8 12h13M8 18h13M4 6h.01M4 12h.01M4 18h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm9 2-4.35-4.35"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
