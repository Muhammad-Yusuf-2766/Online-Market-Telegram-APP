import { Link } from 'react-router-dom';
import { useAppSelector } from '../../../app/hooks';
import { useGetMyNotificationsQuery } from '../../../app/parfumApi';

import './app-top-bar.css';

export function AppTopBar() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: notifications } = useGetMyNotificationsQuery(
    { page: 1, pageSize: 1 },
    { skip: !token, pollingInterval: 30000 },
  );
  const unread = notifications?.unreadCount ?? 0;

  return (
    <header className="tma-top-bar">
      <Link to="/" className="tma-top-bar__brand" aria-label="Ansor Market">
        <span className="tma-top-bar__logo" aria-hidden>
          A
        </span>
        <span className="tma-top-bar__brand-copy">
          <strong>Ansor Market</strong>
          <span>Koreadagi halal mahsulotlar</span>
        </span>
      </Link>
      <div className="tma-top-bar__actions">
        <Link to="/wishlist" className="tma-top-bar__icon-btn" aria-label="Wishlist">
          <HeartIcon />
        </Link>
        <Link
          to="/notifications"
          className="tma-top-bar__icon-btn"
          aria-label="Notifications"
        >
          <BellIcon />
          {token && unread > 0 ? (
            <span className="tma-top-bar__badge-dot">
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s-6.7-4.35-9.33-8.1C.5 9.5 2.5 5.5 6.5 5.5c2.1 0 3.4 1.1 4.5 2.2C12.1 6.6 13.4 5.5 15.5 5.5c4 0 6 4 3.83 7.4C18.7 16.65 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a5 5 0 0 0-5 5v3.1c0 .8-.3 1.6-.8 2.2L4.5 16.5h15l-1.7-3.2c-.5-.6-.8-1.4-.8-2.2V8a5 5 0 0 0-5-5Zm0 18a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 21Z"
        fill="currentColor"
      />
    </svg>
  );
}
