import {
  Alert,
  Button,
  Loader,
  NumberInput,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useGetAdminRewardSettingsQuery,
  usePatchAdminRewardSettingsMutation,
} from '../app/parfumApi';

export function RewardSettingsPage() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useGetAdminRewardSettingsQuery();
  const [patch, { isLoading: saving }] = usePatchAdminRewardSettingsMutation();
  const [referralCoins, setReferralCoins] = useState(0);
  const [profileBirthdayCoins, setProfileBirthdayCoins] = useState(0);
  const [profileGenderCoins, setProfileGenderCoins] = useState(0);
  const [profileLastNameCoins, setProfileLastNameCoins] = useState(0);
  const [profileFullCoins, setProfileFullCoins] = useState(0);

  useEffect(() => {
    if (!data) return;
    setReferralCoins(data.referralCoins);
    setProfileBirthdayCoins(data.profileBirthdayCoins);
    setProfileGenderCoins(data.profileGenderCoins);
    setProfileLastNameCoins(data.profileLastNameCoins);
    setProfileFullCoins(data.profileFullCoins ?? 0);
  }, [data]);

  return (
    <Stack gap="md">
      <Title order={2}>{t('rewards.title')}</Title>
      <Text size="sm" c="dimmed">
        {t('rewards.subtitle')}
      </Text>
      {error ? (
        <Alert color="red" title={t('rewards.loadErrorTitle')}>
          {t('rewards.loadErrorBody')}
        </Alert>
      ) : null}
      {isLoading || !data ? (
        <Loader />
      ) : (
        <Stack gap="sm" maw={420}>
          <NumberInput
            label={t('rewards.referralCoins')}
            min={0}
            value={referralCoins}
            onChange={(v) => setReferralCoins(Number(v) || 0)}
          />
          <NumberInput
            label={t('rewards.profileLastName')}
            min={0}
            value={profileLastNameCoins}
            onChange={(v) => setProfileLastNameCoins(Number(v) || 0)}
          />
          <NumberInput
            label={t('rewards.profileBirthday')}
            min={0}
            value={profileBirthdayCoins}
            onChange={(v) => setProfileBirthdayCoins(Number(v) || 0)}
          />
          <NumberInput
            label={t('rewards.profileGender')}
            min={0}
            value={profileGenderCoins}
            onChange={(v) => setProfileGenderCoins(Number(v) || 0)}
          />
          <NumberInput
            label={t('rewards.profileFull')}
            min={0}
            value={profileFullCoins}
            onChange={(v) => setProfileFullCoins(Number(v) || 0)}
          />
          <Button
            color="parfum"
            loading={saving}
            onClick={() =>
              void patch({
                referralCoins,
                profileBirthdayCoins,
                profileGenderCoins,
                profileLastNameCoins,
                profileFullCoins,
              })
            }
          >
            {t('common.save')}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
