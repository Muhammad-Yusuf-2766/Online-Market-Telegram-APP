import { Spinner } from '@telegram-apps/telegram-ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useGetCoinInboxQuery } from '../../../app/parfumApi';
import { useAppSelector } from '../../../app/hooks';

export function CoinInboxPage() {
  const { t } = useTranslation();
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data, isLoading } = useGetCoinInboxQuery(undefined, { skip: !token });

  if (!token) {
    return (
      <div className="tma-page">
        <h1 className="page-title">{t('coins.inboxTitle')}</h1>
        <p className="page-placeholder">{t('coins.needAuth')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="tma-page tma-page--centered">
        <Spinner size="l" />
      </div>
    );
  }

  const entries = data ?? [];

  return (
    <div className="tma-page">
      <h1 className="page-title">{t('coins.inboxTitle')}</h1>
      <p className="page-placeholder" style={{ marginBottom: 16 }}>
        <Link to="/coins">{t('coins.backToCoins')}</Link>
      </p>
      {entries.length === 0 ? (
        <p className="page-placeholder">{t('coins.inboxEmpty')}</p>
      ) : (
        <ul className="notification-list">
          {entries.map((e) => (
            <li key={e.id} className="notification-item notification-item--static">
              <div className="notification-item__body">
                <strong>{e.kind}</strong>
                <p>
                  {e.delta > 0 ? '+' : ''}
                  {e.delta} {t('coins.uzsLabel')}
                </p>
                <time>{new Date(e.createdAt).toLocaleString()}</time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
