import { Avatar, Badge, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconMail, IconShield, IconUser } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { AdminProfile } from '../../features/auth/authSlice';
import { useRoleLabel } from '../../features/navigation/useRoleLabel';

function initials(profile: AdminProfile): string {
  if (profile.fullName?.trim()) {
    const parts = profile.fullName.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }
  return profile.email.slice(0, 2).toUpperCase();
}

type AdminProfileSummaryProps = {
  profile: AdminProfile;
  compact?: boolean;
};

export function AdminProfileSummary({ profile, compact = false }: AdminProfileSummaryProps) {
  const { t } = useTranslation();
  const roleLabel = useRoleLabel();

  if (compact) {
    return (
      <Group gap="sm" wrap="nowrap">
        <Avatar color="parfum" radius="xl" size="md">
          {initials(profile)}
        </Avatar>
        <Stack gap={0} style={{ minWidth: 0 }}>
          <Text size="sm" fw={600} truncate>
            {profile.fullName?.trim() || profile.email}
          </Text>
          <Group gap={6}>
            <Text size="xs" c="dimmed" truncate>
              {profile.email}
            </Text>
            
          </Group>
        </Stack>
      </Group>
    );
  }

  return (
    <Paper withBorder p="lg" radius="md">
      <Group align="flex-start" wrap="nowrap">
        <Avatar color="parfum" radius="xl" size={72}>
          {initials(profile)}
        </Avatar>
        <Stack gap="sm" style={{ flex: 1 }}>
          <div>
            <Text size="lg" fw={700}>
              {profile.fullName?.trim() || profile.email}
            </Text>
            <Text size="sm" c="dimmed">
              {t('welcome.subtitle')}
            </Text>
          </div>
          <Group gap="xs">
            {profile.role?.isSuperAdmin ? (
              <Badge color="parfum" variant="filled">
                {t('welcome.superAdmin')}
              </Badge>
            ) : null}
            <Badge color={profile.isActive ? 'green' : 'gray'} variant="light">
              {profile.isActive ? t('common.active') : t('settings.adminUsers.inactive')}
            </Badge>
          </Group>
          <Stack gap={8}>
            <Group gap="xs">
              <ThemeIcon size="sm" variant="light" color="parfum">
                <IconMail size={14} />
              </ThemeIcon>
              <Text size="sm">{profile.email}</Text>
            </Group>
            {profile.fullName ? (
              <Group gap="xs">
                <ThemeIcon size="sm" variant="light" color="parfum">
                  <IconUser size={14} />
                </ThemeIcon>
                <Text size="sm">{profile.fullName}</Text>
              </Group>
            ) : null}
            <Group gap="xs">
              <ThemeIcon size="sm" variant="light" color="parfum">
                <IconShield size={14} />
              </ThemeIcon>
              <Text size="sm">
                {t('welcome.role')}: <strong>{roleLabel(profile.role)}</strong>
                {profile.role ? (
                  <Text span c="dimmed" size="xs" ml={6}>
                    ({profile.role.key})
                  </Text>
                ) : null}
              </Text>
            </Group>
            <Text size="sm" c="dimmed">
              {t('welcome.permissionCount', { count: profile.permissions.length })}
            </Text>
          </Stack>
        </Stack>
      </Group>
    </Paper>
  );
}
