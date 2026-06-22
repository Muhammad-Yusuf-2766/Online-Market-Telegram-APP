import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useCreateBannerMutation,
  useDeleteBannerMutation,
  useGetAdminBannersQuery,
  useUpdateBannerMutation,
} from '../app/parfumApi';

type BannerRow = {
  id: string;
  imageUrl: string;
  title: string | null;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

export function BannersPage() {
  const { t } = useTranslation();
  const { data } = useGetAdminBannersQuery();
  const [createBanner, { isLoading: creating }] = useCreateBannerMutation();
  const [updateBanner] = useUpdateBannerMutation();
  const [deleteBanner, { isLoading: deleting }] = useDeleteBannerMutation();
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [removing, setRemoving] = useState<BannerRow | null>(null);

  async function submit() {
    if (!imageUrl.trim()) return;
    try {
      await createBanner({
        imageUrl: imageUrl.trim(),
        title: title.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
        isActive: true,
      }).unwrap();
      setImageUrl('');
      setTitle('');
      setLinkUrl('');
      notifications.show({ color: 'green', title: t('common.create'), message: '' });
    } catch {
      notifications.show({ color: 'red', title: t('common.error'), message: '' });
    }
  }

  return (
    <Stack>
      <Title order={2}>{t('banners.title')}</Title>
      <Text size="sm" c="dimmed">
        {t('banners.subtitle')}
      </Text>
      <Group align="flex-end">
        <TextInput
          label={t('banners.imageUrl')}
          value={imageUrl}
          onChange={(e) => setImageUrl(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <TextInput
          label={t('banners.bannerTitle')}
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
        />
        <TextInput
          label={t('banners.linkUrl')}
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.currentTarget.value)}
        />
        <Button color="parfum" loading={creating} onClick={submit}>
          {t('banners.create')}
        </Button>
      </Group>
      <Table withTableBorder striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('banners.imageUrl')}</Table.Th>
            <Table.Th>{t('banners.bannerTitle')}</Table.Th>
            <Table.Th>{t('banners.active')}</Table.Th>
            <Table.Th>{t('common.actions')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(data ?? []).map((row) => (
            <Table.Tr key={row.id}>
              <Table.Td>
                <a href={row.imageUrl} target="_blank" rel="noreferrer">
                  {row.imageUrl.slice(0, 48)}…
                </a>
              </Table.Td>
              <Table.Td>{row.title ?? '—'}</Table.Td>
              <Table.Td>
                <Switch
                  checked={row.isActive}
                  onChange={(e) =>
                    void updateBanner({
                      id: row.id,
                      isActive: e.currentTarget.checked,
                    })
                  }
                />
              </Table.Td>
              <Table.Td>
                <ActionIcon variant="subtle" color="red" onClick={() => setRemoving(row)}>
                  <IconTrash size={18} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={removing !== null} onClose={() => setRemoving(null)} title={t('banners.modalDelete')}>
        <Text size="sm">
          {t('banners.deleteConfirm', {
            title: removing?.title?.trim() || removing?.imageUrl.slice(0, 48) || '—',
          })}
        </Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setRemoving(null)}>
            {t('common.cancel')}
          </Button>
          <Button
            color="red"
            loading={deleting}
            onClick={async () => {
              if (!removing) return;
              try {
                await deleteBanner(removing.id).unwrap();
                setRemoving(null);
                notifications.show({ color: 'green', title: t('common.delete'), message: '' });
              } catch {
                notifications.show({ color: 'red', title: t('common.error'), message: '' });
              }
            }}
          >
            {t('common.delete')}
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}
