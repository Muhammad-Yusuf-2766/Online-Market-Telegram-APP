import {
  AppShell,
  Burger,
  Group,
  ScrollArea,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';
import { AdminProfileMenu } from '../features/auth/AdminProfileMenu';
import { useCurrentAdmin } from '../features/auth/useCurrentAdmin';
import {
  filterNavSections,
  getAdminNavSections,
} from '../features/navigation/adminNavSections';
import { NotificationsBell } from '../features/notifications/NotificationsBell';
import { useAdminOrdersRealtime } from '../features/orders/useAdminOrdersRealtime';
export function AdminLayout() {
  useAdminOrdersRealtime();
  const { t } = useTranslation();
  const { hasPermission, profile } = useCurrentAdmin();
  const [opened, { toggle }] = useDisclosure();
  const isMobile = useMediaQuery('(max-width: 47.99em)');

  const navSections = useMemo(
    () => filterNavSections(getAdminNavSections(t), hasPermission),
    [hasPermission, t],
  );

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group wrap="nowrap" style={{ minWidth: 0 }}>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4} c="parfum.8" visibleFrom="sm">
              {t('layout.brand')}
            </Title>
          </Group>
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <NotificationsBell />
            {profile ? <AdminProfileMenu profile={profile} /> : null}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <ScrollArea type="never" style={{ height: 'calc(100% - 32px)' }}>
          {navSections.map((section) => (
            <div key={section.title}>
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={6} mt="xs">
                {section.title}
              </Text>
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => {
                    if (isMobile && opened) toggle();
                  }}
                  style={{ textDecoration: 'none' }}
                >
                  {({ isActive }) => (
                    <Group
                      gap="sm"
                      px="sm"
                      py={10}
                      mb={4}
                      style={{
                        borderRadius: 8,
                        backgroundColor: isActive
                          ? 'var(--mantine-color-parfum-0)'
                          : undefined,
                        color: isActive
                          ? 'var(--mantine-color-parfum-8)'
                          : 'var(--mantine-color-dark-6)',
                        fontWeight: isActive ? 600 : 500,
                      }}
                    >
                      <Icon size={18} stroke={1.75} />
                      <Text size="sm">{label}</Text>
                    </Group>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
        <Text size="xs" c="dimmed" ta="center" mt="xl" pb="xs">
          v{__APP_VERSION__} · {__GIT_SHA__.slice(0, 7)}
        </Text>
      </AppShell.Main>
    </AppShell>
  );
}
