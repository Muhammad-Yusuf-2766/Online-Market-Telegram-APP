import { Button, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  const { t } = useTranslation();

  return (
    <Stack align="center" justify="center" mih="50vh" gap="md">
      <Title order={2}>{t('settings.forbidden.title')}</Title>
      <Text c="dimmed" ta="center" maw={420}>
        {t('settings.forbidden.body')}
      </Text>
      <Button component={Link} to="/welcome" color="parfum">
        {t('settings.forbidden.back')}
      </Button>
    </Stack>
  );
}
