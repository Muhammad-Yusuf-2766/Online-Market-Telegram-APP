import { Button, Input, Select, Spinner } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useGetRewardSettingsQuery,
  usePatchMeMutation,
  type UserGender,
  type UserProfile,
} from '../../../app/parfumApi';
import { useParfumMeQuery } from '../../../app/useParfumMeQuery';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { setUser } from '../../../features/auth/authSlice';
import { useTelegramSession } from '../../../features/session/telegramSessionContext';
import {
  formatUzPhoneDisplay,
  parseNationalDigits,
  uzPhoneKeyDownGuard,
  uzPhoneToE164,
} from '../../../shared/lib/uzPhoneMask';

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function ProfileEditor({ me }: { me: UserProfile }) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s) => s.auth.user);

  const [patchMe, { isLoading: saving }] = usePatchMeMutation();
  const { data: rewards } = useGetRewardSettingsQuery();

  const missingFields: Array<{ key: string; coins: number; filled: boolean }> = [
    {
      key: 'lastName',
      coins: rewards?.profileLastNameCoins ?? 0,
      filled: Boolean(me.lastName?.trim()),
    },
    {
      key: 'birthDate',
      coins: rewards?.profileBirthdayCoins ?? 0,
      filled: Boolean(me.birthDate),
    },
    {
      key: 'gender',
      coins: rewards?.profileGenderCoins ?? 0,
      filled: me.gender !== 'UNSPECIFIED',
    },
  ];
  const earnable = missingFields.filter((f) => !f.filled && f.coins > 0);
  const totalEarnable = earnable.reduce((s, f) => s + f.coins, 0);

  const [nationalDigits, setNationalDigits] = useState(() =>
    parseNationalDigits(me.phone ?? ''),
  );
  const [firstName, setFirstName] = useState(me.firstName ?? '');
  const [lastName, setLastName] = useState(me.lastName ?? '');
  const [birthDate, setBirthDate] = useState(toDateInputValue(me.birthDate));
  const [gender, setGender] = useState<UserGender>(me.gender ?? 'UNSPECIFIED');

  const handleSave = async () => {
    const updated = await patchMe({
      phone: uzPhoneToE164(nationalDigits),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      birthDate: birthDate.trim() || undefined,
      gender,
    }).unwrap();
    dispatch(
      setUser({
        id: updated.id,
        telegramId: updated.telegramId,
        telegramUsername: updated.telegramUsername,
        firstName: updated.firstName,
        lastName: updated.lastName,
      }),
    );
  };

  return (
    <div className="tma-page">
      <h1 className="page-title">{t('profile.title')}</h1>
      <p className="page-placeholder" style={{ marginBottom: 16 }}>
        {me.telegramUsername ? `@${me.telegramUsername}` : t('profile.telegramLine')}{' '}
        · ID {me.telegramId}
      </p>
      {earnable.length > 0 ? (
        <section className="profile-nudge" aria-label={t('profile.completeForCoins')}>
          <strong>{t('profile.completeForCoins', { n: totalEarnable })}</strong>
          <ul>
            {earnable.map((f) => (
              <li key={f.key}>
                {t(`profile.field.${f.key}`)} — +{f.coins} {t('coins.uzsLabel')}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <div className="form-stack">
        <Input
          id="pf-phone"
          type="tel"
          inputMode="numeric"
          header={t('profile.phone')}
          placeholder={t('profile.phonePlaceholder')}
          value={formatUzPhoneDisplay(nationalDigits)}
          onChange={(e) => setNationalDigits(parseNationalDigits(e.target.value))}
          onKeyDown={uzPhoneKeyDownGuard}
          autoComplete="tel"
        />
        <Input
          id="pf-first"
          header={t('profile.firstName')}
          placeholder={t('profile.firstName')}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
        />
        <Input
          id="pf-last"
          header={t('profile.lastName')}
          placeholder={t('profile.lastName')}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="family-name"
        />
        <Input
          id="pf-birth"
          type="date"
          header={t('profile.birthday')}
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          autoComplete="bday"
        />
        <Select
          id="pf-gender"
          header={t('profile.gender')}
          value={gender}
          onChange={(e) => setGender(e.target.value as UserGender)}
        >
          <option value="UNSPECIFIED">{t('profile.genderUnspecified')}</option>
          <option value="MALE">{t('profile.genderMale')}</option>
          <option value="FEMALE">{t('profile.genderFemale')}</option>
          <option value="OTHER">{t('profile.genderOther')}</option>
        </Select>
      </div>
      <Button
        mode="filled"
        size="l"
        stretched
        loading={saving}
        disabled={saving}
        onClick={() => void handleSave()}
      >
        {t('profile.save')}
      </Button>
      {authUser ? (
        <p className="page-placeholder" style={{ marginTop: 20 }}>
          {t('profile.signedInAs', {
            name:
              [authUser.firstName, authUser.lastName].filter(Boolean).join(' ') ||
              t('profile.userFallback'),
          })}
        </p>
      ) : null}
      <p
        className="page-placeholder"
        style={{ marginTop: 16, fontSize: '0.75rem', opacity: 0.7 }}
      >
        v{__APP_VERSION__} · {__GIT_SHA__.slice(0, 7)}
      </p>
    </div>
  );
}

export function ProfilePage() {
  const { t } = useTranslation();
  const token = useAppSelector((s) => s.auth.accessToken);
  const { isTelegramAuthPending, telegramSignInError } = useTelegramSession();

  const { data: me, isLoading, isError } = useParfumMeQuery({
    skip: !token,
  });

  if (!token) {
    if (isTelegramAuthPending) {
      return (
        <div className="tma-page tma-page--centered">
          <Spinner size="l" />
        </div>
      );
    }
    return (
      <div className="tma-page">
        <h1 className="page-title">{t('profile.title')}</h1>
        {telegramSignInError ? (
          <p
            className="page-placeholder"
            style={{ color: 'var(--pb-danger, #b42318)', marginBottom: 12 }}
          >
            {telegramSignInError}
          </p>
        ) : null}
        <p className="page-placeholder">{t('profile.signInHint')}</p>
      </div>
    );
  }

  if (isLoading && !me) {
    return (
      <div className="tma-page tma-page--centered">
        <Spinner size="l" />
      </div>
    );
  }

  if (isError || !me) {
    return (
      <div className="tma-page">
        <h1 className="page-title">{t('profile.title')}</h1>
        <p className="page-placeholder">{t('profile.loadError')}</p>
      </div>
    );
  }

  return <ProfileEditor key={me.updatedAt} me={me} />;
}
