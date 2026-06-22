import {
  ActionIcon,
  Box,
  Button,
  Group,
  Indicator,
  Loader,
  Menu,
  ScrollArea,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconBell, IconVolume, IconVolumeOff } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '../../app/parfumApi';
import {
  playNotificationSound,
  setNotificationSoundMuted,
  useNotificationSoundMuted,
} from './notificationSound';

export function NotificationsBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useGetNotificationsQuery(
    undefined,
    { refetchOnFocus: true },
  );
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] =
    useMarkAllNotificationsReadMutation();
  const soundMuted = useNotificationSoundMuted();

  const items = data ?? [];
  const unreadCount = items.filter((n) => !n.read).length;

  const toggleSoundMuted = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !soundMuted;
    setNotificationSoundMuted(next);
    if (!next) {
      // Unmuting counts as a user gesture; preview the chime so the admin
      // hears the volume and the browser unblocks future autoplay.
      playNotificationSound();
    }
  };

  return (
    <Menu
      shadow="md"
      width={380}
      position="bottom-end"
      withinPortal
      onOpen={() => void refetch()}
    >
      <Menu.Target>
        <Indicator
          inline
          disabled={unreadCount === 0}
          label={unreadCount > 99 ? '99+' : unreadCount}
          size={20}
          color="parfum"
          zIndex={1}
        >
          <ActionIcon
            variant="subtle"
            color="parfum"
            aria-label={t('notifications.title')}
          >
            <IconBell size={22} stroke={1.75} />
          </ActionIcon>
        </Indicator>
      </Menu.Target>
      <Menu.Dropdown p={0}>
        <Box px="sm" py="xs">
          <Group justify="space-between" wrap="nowrap" gap="xs">
            <Text fw={600} size="sm">
              {t('notifications.title')}
            </Text>
            <Group gap="xs" wrap="nowrap">
              <Tooltip
                label={t(
                  soundMuted
                    ? 'notifications.unmuteSound'
                    : 'notifications.muteSound',
                )}
                withArrow
              >
                <ActionIcon
                  variant="subtle"
                  color="parfum"
                  size="md"
                  aria-label={t(
                    soundMuted
                      ? 'notifications.unmuteSound'
                      : 'notifications.muteSound',
                  )}
                  onClick={toggleSoundMuted}
                >
                  {soundMuted ? (
                    <IconVolumeOff size={18} stroke={1.75} />
                  ) : (
                    <IconVolume size={18} stroke={1.75} />
                  )}
                </ActionIcon>
              </Tooltip>
              <Button
                size="compact-xs"
                variant="light"
                color="parfum"
                loading={markingAll}
                disabled={unreadCount === 0 || markingAll}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void markAllRead();
                }}
              >
                {t('notifications.markAllRead')}
              </Button>
            </Group>
          </Group>
        </Box>
        <Menu.Divider />
        {isLoading ? (
          <Box py="lg" ta="center">
            <Loader size="sm" color="parfum" />
          </Box>
        ) : isError ? (
          <Text size="sm" c="red" px="sm" py="md">
            {t('notifications.loadError')}
          </Text>
        ) : items.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="lg" px="sm">
            {t('notifications.empty')}
          </Text>
        ) : (
          <ScrollArea.Autosize mah={320} type="hover">
            <Box pb="xs">
              {items.map((n) => (
                <Menu.Item
                  key={n.id}
                  closeMenuOnClick
                  onClick={() => {
                    if (!n.read) {
                      void markRead(n.id);
                    }
                    navigate('/orders');
                  }}
                  py={8}
                >
                  <div>
                    <Text
                      size="sm"
                      fw={n.read ? 500 : 700}
                      c={n.read ? 'dimmed' : undefined}
                    >
                      {t(`notifications.kind.${n.kind}`)}
                    </Text>
                    <Group justify="space-between" gap="xs" mt={4}>
                      <Text size="xs" ff="monospace" c="dimmed">
                        {n.orderId.slice(0, 8)}…
                      </Text>
                      <Text size="xs" c="dimmed">
                        {dayjs(n.createdAt).format('DD.MM.YYYY HH:mm')}
                      </Text>
                    </Group>
                  </div>
                </Menu.Item>
              ))}
            </Box>
          </ScrollArea.Autosize>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
