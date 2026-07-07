import { Button, Input, Select, Spinner } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  useDeleteUserAddressMutation,
  useGetUserAddressesQuery,
  usePatchMeMutation,
  useUpdateUserAddressMutation,
  type UserAddress,
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

function displayAddress(address: UserAddress): string {
  return [
    address.roadAddressName || address.addressName || address.jibunAddressName,
    address.detailAddress,
  ]
    .filter(Boolean)
    .join(', ');
}

function ProfileAddresses() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: addresses = [], isLoading } = useGetUserAddressesQuery();
  const [updateAddress, { isLoading: updating }] = useUpdateUserAddressMutation();
  const [deleteAddress, { isLoading: deleting }] = useDeleteUserAddressMutation();
  const isBusy = updating || deleting;

  async function makeDefault(address: UserAddress) {
    if (address.isDefault) return;
    await updateAddress({ id: address.id, patch: { isDefault: true } }).unwrap();
  }

  async function removeAddress(address: UserAddress) {
    if (!window.confirm(t('profile.addressDeleteConfirm'))) return;
    await deleteAddress(address.id).unwrap();
  }

  return (
    <section style={{ marginTop: 24 }}>
      <h2 className="page-title" style={{ fontSize: 20, marginBottom: 10 }}>
        {t('profile.addressesTitle')}
      </h2>
      {isLoading ? (
        <div className="tma-page--centered" style={{ padding: 12 }}>
          <Spinner size="m" />
        </div>
      ) : addresses.length > 0 ? (
        <div className="checkout-location-search-results" style={{ marginBottom: 12 }}>
          {addresses.map((address) => (
            <div
              key={address.id}
              className="checkout-location-search-results__item"
              style={{ textAlign: 'left' }}
            >
              <strong>
                {address.label || displayAddress(address)}
                {address.isDefault ? (
                  <span
                    style={{
                      marginLeft: 8,
                      padding: '2px 7px',
                      borderRadius: 999,
                      fontSize: 11,
                      color: 'var(--tg-theme-button-text-color, #fff)',
                      background: 'var(--tg-theme-button-color, #2481cc)',
                    }}
                  >
                    {t('profile.addressDefaultBadge')}
                  </span>
                ) : null}
              </strong>
              <span>{displayAddress(address)}</span>
              {address.zoneNo ? <span>{address.zoneNo}</span> : null}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <Button
                  mode="bezeled"
                  size="s"
                  disabled={isBusy || address.isDefault}
                  onClick={() => void makeDefault(address).catch(() => undefined)}
                >
                  {t('profile.makeDefaultAddress')}
                </Button>
                <Button
                  mode="bezeled"
                  size="s"
                  disabled={isBusy}
                  onClick={() => void removeAddress(address).catch(() => undefined)}
                >
                  {t('profile.deleteAddress')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="page-placeholder" style={{ marginBottom: 12 }}>
          {t('profile.addressesEmpty')}
        </p>
      )}
      <Button
        mode="bezeled"
        size="m"
        stretched
        disabled={addresses.length >= 3}
        onClick={() =>
          navigate('/checkout/address', {
            state: { profileAddressMode: true, returnTo: '/profile' },
          })
        }
      >
        {addresses.length >= 3
          ? t('profile.addressLimitReached')
          : t('profile.addAddress')}
      </Button>
    </section>
  );
}

function ProfileEditor({ me }: { me: UserProfile }) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s) => s.auth.user);

  const [patchMe, { isLoading: saving }] = usePatchMeMutation();

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
      <div className="form-stack">
        <Input
          id="pf-phone"
          className="tma-form-control"
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
          className="tma-form-control"
          header={t('profile.firstName')}
          placeholder={t('profile.firstName')}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
        />
        <Input
          id="pf-last"
          className="tma-form-control"
          header={t('profile.lastName')}
          placeholder={t('profile.lastName')}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="family-name"
        />
        <Input
          id="pf-birth"
          className="tma-form-control"
          type="date"
          header={t('profile.birthday')}
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          autoComplete="bday"
        />
        <Select
          id="pf-gender"
          className="tma-form-control"
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
      <ProfileAddresses />
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
