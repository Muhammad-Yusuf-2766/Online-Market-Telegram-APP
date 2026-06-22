import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { openTelegramLink, shareURL } from '@telegram-apps/sdk';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  useGetReferralTreeQuery,
  useGetRewardSettingsQuery,
} from '../../../app/parfumApi';
import { useParfumMeQuery } from '../../../app/useParfumMeQuery';
import { useAppSelector } from '../../../app/hooks';
import { ReferralTree } from './ReferralTree';
import './coins-page.css';

function buildReferralShareUrl(referralCode: string): string | null {
  const bot = import.meta.env.VITE_TELEGRAM_BOT_USERNAME?.replace(
    /^@/,
    '',
  ).trim();
  const shortName = import.meta.env.VITE_TELEGRAM_WEB_APP_SHORT_NAME?.trim();
  if (!bot || !shortName) return null;
  return `https://t.me/${bot}/${shortName}?startapp=ref_${encodeURIComponent(referralCode)}`;
}

export function CoinsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: me, isLoading: meLoading } = useParfumMeQuery({ skip: !token });
  const { data: rewards } = useGetRewardSettingsQuery();
  const { data: tree, isLoading: treeLoading } = useGetReferralTreeQuery(
    { maxDepth: 5 },
    { skip: !token },
  );

  const shareUrl = me ? buildReferralShareUrl(me.referralCode) : null;

  const shareReferral = () => {
    if (!shareUrl) return;
    const caption = t('coins.shareReferralCaption');
    if (shareURL.isAvailable()) {
      shareURL(shareUrl, caption);
      return;
    }
    const tgShare = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(caption)}`;
    if (openTelegramLink.isAvailable()) {
      openTelegramLink(tgShare);
      return;
    }
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      void navigator.share({ url: shareUrl, text: caption }).catch(() => {});
    }
  };

  const copyShareUrl = () => {
    if (!shareUrl) return;
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(shareUrl);
    }
  };

  if (!token) {
    return (
      <div className="tma-page">
        <h1 className="page-title">{t('coins.title')}</h1>
        <p className="page-placeholder">{t('coins.needAuth')}</p>
        <Button
          mode="bezeled"
          size="m"
          style={{ marginTop: 12 }}
          onClick={() => navigate('/')}
        >
          {t('coins.backHome')}
        </Button>
      </div>
    );
  }

  if (meLoading || !me) {
    return (
      <div className="tma-page tma-page--centered">
        <Spinner size="l" />
      </div>
    );
  }

  return (
    <div className="tma-page">
      <h1 className="page-title">{t('coins.title')}</h1>
      <p className="page-placeholder" style={{ marginBottom: 8 }}>
        {t('coins.subtitle')}
      </p>
      <p className="page-placeholder" style={{ marginBottom: 16 }}>
        {t('coins.balanceLine', { amount: me.coinBalance })}
      </p>

      <p style={{ marginBottom: 16 }}>
        <Button mode="bezeled" size="s" onClick={() => navigate('/coins/inbox')}>
          {t('coins.viewInboxHistory')}
        </Button>
      </p>

      <section style={{ marginBottom: 24 }}>
        <h2 className="page-title" style={{ fontSize: 17, marginBottom: 8 }}>
          {t('coins.howToEarn')}
        </h2>
        <ul className="page-placeholder" style={{ paddingLeft: 18, margin: 0 }}>
          <li style={{ marginBottom: 6 }}>
            {t('coins.earnReferral', { n: rewards?.referralCoins ?? 0 })}
          </li>
          <li style={{ marginBottom: 6 }}>
            {t('coins.earnProfile', {
              last: rewards?.profileLastNameCoins ?? 0,
              bd: rewards?.profileBirthdayCoins ?? 0,
              g: rewards?.profileGenderCoins ?? 0,
            })}
          </li>
          <li style={{ marginBottom: 6 }}>
            {t('coins.earnProfileFull', { n: rewards?.profileFullCoins ?? 0 })}
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 className="page-title" style={{ fontSize: 17, marginBottom: 8 }}>
          {t('coins.referralLink')}
        </h2>
        {shareUrl ? (
          <>
            <p
              className="page-placeholder"
              style={{
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                fontSize: 12,
                marginBottom: 10,
              }}
            >
              {shareUrl}
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <Button mode="filled" size="m" stretched onClick={shareReferral}>
                {t('coins.shareReferral')}
              </Button>
              <Button mode="bezeled" size="m" stretched onClick={copyShareUrl}>
                {t('coins.copy')}
              </Button>
            </div>
            <p
              className="page-placeholder"
              style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}
            >
              {t('coins.shareReferralHint')}
            </p>
            {!import.meta.env.VITE_TELEGRAM_BOT_USERNAME ? (
              <p
                className="page-placeholder"
                style={{ marginTop: 8, fontSize: 12 }}
              >
                {t('coins.envHint')}
              </p>
            ) : null}
          </>
        ) : (
          <p className="page-placeholder">{t('coins.envHint')}</p>
        )}
      </section>

      <section>
        <h2 className="page-title" style={{ fontSize: 17, marginBottom: 8 }}>
          {t('coins.treeTitle')}
        </h2>
        {treeLoading || !tree ? (
          <Spinner size="m" />
        ) : (
          <ReferralTree root={tree} maxDepth={5} />
        )}
      </section>

      <Button
        mode="bezeled"
        size="m"
        stretched
        style={{ marginTop: 24 }}
        onClick={() => navigate('/')}
      >
        {t('coins.backHome')}
      </Button>
    </div>
  );
}
