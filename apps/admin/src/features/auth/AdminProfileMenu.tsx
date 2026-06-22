import {
  Badge,
  Box,
  Divider,
  Group,
  Menu,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { IconHome, IconLogout } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { AdminProfileSummary } from '../../shared/ui/AdminProfileSummary';
import type { AdminProfile } from './authSlice';
import { performLogout } from './logout';
import { useRoleLabel } from '../navigation/useRoleLabel';

type AdminProfileMenuProps = {
  profile: AdminProfile;
};

export function AdminProfileMenu({ profile }: AdminProfileMenuProps) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const roleLabel = useRoleLabel();

  const handleLogout = () => {
    performLogout(dispatch);
    navigate('/login', { replace: true });
  };

  return (
    <Menu shadow="md" width={320} position="bottom-end" withinPortal>
      <Menu.Target>
        <UnstyledButton
          aria-label={t('profile.menu')}
          style={{
            borderRadius: 'var(--mantine-radius-md)',
            padding: '4px 8px',
            maxWidth: 'min(280px, 42vw)',
          }}
        >
          <AdminProfileSummary profile={profile} compact />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Box px="sm" py="xs">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            {t('profile.signedInAs')}
          </Text>
          <Text size="sm" fw={600} mt={4} truncate>
            {profile.fullName?.trim() || profile.email}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            {profile.email}
          </Text>
          <Group gap={6} mt={8}>
            {profile.role ? (
              <Badge size="xs" variant="light" color="parfum">
                {roleLabel(profile.role)}
              </Badge>
            ) : null}
            <Badge size="xs" variant="light" color={profile.isActive ? 'green' : 'gray'}>
              {profile.isActive ? t('common.active') : t('settings.adminUsers.inactive')}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed" mt={6}>
            {t('welcome.permissionCount', { count: profile.permissions.length })}
          </Text>
        </Box>
        <Divider />
        <Menu.Item
          leftSection={<IconHome size={16} stroke={1.75} />}
          onClick={() => navigate('/welcome')}
        >
          {t('profile.viewAccount')}
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={16} stroke={1.75} />}
          onClick={handleLogout}
        >
          {t('common.signOut')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
