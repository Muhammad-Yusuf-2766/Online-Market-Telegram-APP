import {
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useCurrentAdmin } from '../features/auth/useCurrentAdmin';
import {
  filterNavSections,
  getAdminNavSections,
} from '../features/navigation/adminNavSections';
import { AdminProfileSummary } from '../shared/ui/AdminProfileSummary';

export function WelcomePage() {
  const { t } = useTranslation();
  const { profile, isSuperAdmin } = useCurrentAdmin();

  const quickLinks = useMemo(() => {
    if (!profile) return [];
    const sections = filterNavSections(getAdminNavSections(t));
    return sections.flatMap((section) =>
      section.items
        .filter((item) => item.to !== '/welcome')
        .map((item) => ({ ...item, sectionTitle: section.title })),
    );
  }, [profile, t]);

  if (!profile) {
    return null;
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>{t('welcome.title')}</Title>
        <Text c="dimmed" size="sm" mt={4}>
          {t('welcome.lead')}
        </Text>
      </div>

      <AdminProfileSummary profile={profile} />

      {quickLinks.length > 0 ? (
        <Stack gap="sm">
          <Title order={4}>{t('welcome.quickAccess')}</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {quickLinks.map(({ to, label, icon: Icon, sectionTitle }) => (
              <Card key={to} withBorder padding="md" radius="md" component={Link} to={to}>
                <Group wrap="nowrap" align="flex-start">
                  <Icon size={22} stroke={1.5} color="var(--mantine-color-parfum-6)" />
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      {sectionTitle}
                    </Text>
                    <Text fw={600}>{label}</Text>
                  </Stack>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      ) : (
        <Card withBorder padding="lg" radius="md">
          <Stack gap="sm">
            <Text fw={600}>{t('welcome.noModulesTitle')}</Text>
            <Text size="sm" c="dimmed">
              {t('welcome.noModulesBody')}
            </Text>
            {isSuperAdmin ? (
              <Button component={Link} to="/settings/admin-users" color="parfum" w="fit-content">
                {t('nav.settingsAdminUsers')}
              </Button>
            ) : null}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
