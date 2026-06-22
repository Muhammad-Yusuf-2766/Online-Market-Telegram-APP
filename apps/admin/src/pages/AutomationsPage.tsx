import { Alert, Stack, Switch, Text, Title } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function AutomationsPage() {
  const { t } = useTranslation();
  const [birthday, setBirthday] = useState(true);
  const [winBack, setWinBack] = useState(true);
  const [postPurchase, setPostPurchase] = useState(true);
  return (
    <Stack>
      <Title order={2}>{t('automations.title')}</Title>
      <Text c="dimmed">{t('automations.subtitle')}</Text>
      <Switch
        checked={birthday}
        onChange={(e) => setBirthday(e.currentTarget.checked)}
        label={t('automations.birthday')}
      />
      <Switch
        checked={winBack}
        onChange={(e) => setWinBack(e.currentTarget.checked)}
        label={t('automations.winBack')}
      />
      <Switch
        checked={postPurchase}
        onChange={(e) => setPostPurchase(e.currentTarget.checked)}
        label={t('automations.postPurchase')}
      />
      <Alert color="yellow">{t('automations.note')}</Alert>
    </Stack>
  );
}
