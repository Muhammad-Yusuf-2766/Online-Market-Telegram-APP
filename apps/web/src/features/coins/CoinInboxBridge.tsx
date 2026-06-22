import { Button } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  parfumApi,
  useGetCoinInboxQuery,
  usePostCoinInboxAckMutation,
} from '../../app/parfumApi';
import './coin-inbox.css';
import { useAppDispatch, useAppSelector } from '../../app/hooks';

export function CoinInboxBridge() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: inbox, isSuccess } = useGetCoinInboxQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });
  const [ack] = usePostCoinInboxAckMutation();
  const [open, setOpen] = useState(false);

  const firstInboxId = inbox?.[0]?.id;
  useEffect(() => {
    if (!firstInboxId) return;
    dispatch(parfumApi.util.invalidateTags([{ type: 'UserProfile', id: 'ME' }]));
  }, [dispatch, firstInboxId]);

  useEffect(() => {
    if (isSuccess && inbox && inbox.length > 0) {
      setOpen(true);
    }
  }, [isSuccess, inbox]);

  if (!open || !inbox?.length) {
    return null;
  }

  const first = inbox[0]!;
  const meta =
    first.metadata && typeof first.metadata === 'object'
      ? (first.metadata as Record<string, unknown>)
      : {};
  const title =
    typeof meta.title === 'string'
      ? meta.title
      : first.kind === 'REFERRAL_EARNED'
        ? t('coins.inboxReferralTitle')
        : first.kind === 'PROFILE_BONUS'
          ? meta.reason === 'fullProfile'
            ? t('coins.inboxFullProfileTitle')
            : t('coins.inboxProfileTitle')
          : t('coins.inboxGiftTitle');

  return (
    <div className="coin-inbox-overlay" role="dialog" aria-modal="true">
      <div className="coin-inbox-modal">
        <h2 className="coin-inbox-modal__title">{title}</h2>
        <p className="coin-inbox-modal__amount">
          +{first.delta} {t('coins.uzsLabel')}
        </p>
        <p className="page-placeholder" style={{ marginBottom: 8 }}>
          {t('coins.inboxHint')}
        </p>
        <p style={{ marginBottom: 16 }}>
          <Link to="/coins/inbox">{t('coins.viewInboxHistory')}</Link>
        </p>
        <Button
          mode="filled"
          size="m"
          stretched
          onClick={() => {
            void ack()
              .unwrap()
              .then(() => setOpen(false))
              .catch(() => setOpen(false));
          }}
        >
          {t('coins.inboxOk')}
        </Button>
      </div>
    </div>
  );
}
