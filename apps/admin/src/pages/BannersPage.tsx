import {
  ActionIcon,
  Button,
  FileInput,
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
import { IconPencil, IconTrash, IconUpload } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useCreateBannerMutation,
  useDeleteBannerMutation,
  useGetAdminBannersQuery,
  useUpdateBannerMutation,
  useUploadBannerImageMutation,
} from '../app/parfumApi';
import { resolveMediaUrl } from '../shared/lib/media';

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
  const [updateBanner, { isLoading: updating }] = useUpdateBannerMutation();
  const [deleteBanner, { isLoading: deleting }] = useDeleteBannerMutation();
  const [uploadBannerImage, { isLoading: uploading }] = useUploadBannerImageMutation();
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [editing, setEditing] = useState<BannerRow | null>(null);
  const [editForm, setEditForm] = useState({
    imageUrl: '',
    title: '',
    linkUrl: '',
    isActive: true,
  });
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

  function openEdit(row: BannerRow) {
    setEditing(row);
    setEditForm({
      imageUrl: row.imageUrl,
      title: row.title ?? '',
      linkUrl: row.linkUrl ?? '',
      isActive: row.isActive,
    });
  }

  async function submitEdit() {
    if (!editing || !editForm.imageUrl.trim()) return;
    try {
      await updateBanner({
        id: editing.id,
        imageUrl: editForm.imageUrl.trim(),
        title: editForm.title.trim() || null,
        linkUrl: editForm.linkUrl.trim() || null,
        isActive: editForm.isActive,
      }).unwrap();
      setEditing(null);
      notifications.show({ color: 'green', title: t('common.save'), message: '' });
    } catch {
      notifications.show({ color: 'red', title: t('common.error'), message: '' });
    }
  }

  async function upload(file: File | null, target: 'create' | 'edit') {
    if (!file) return;
    try {
      const result = await uploadBannerImage(file).unwrap();
      if (target === 'create') {
        setImageUrl(result.url);
      } else {
        setEditForm((prev) => ({ ...prev, imageUrl: result.url }));
      }
      notifications.show({ color: 'green', message: t('banners.uploaded') });
    } catch {
      notifications.show({ color: 'red', message: t('banners.uploadError') });
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
      <FileInput
        label={t('banners.uploadImage')}
        placeholder={t('banners.uploadImagePlaceholder')}
        accept="image/png,image/jpeg,image/webp,image/gif"
        leftSection={<IconUpload size={16} />}
        clearable
        disabled={uploading}
        onChange={(file) => void upload(file, 'create')}
      />
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
                <a href={resolveMediaUrl(row.imageUrl) ?? row.imageUrl} target="_blank" rel="noreferrer">
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
                <ActionIcon variant="subtle" onClick={() => openEdit(row)} mr="xs">
                  <IconPencil size={18} />
                </ActionIcon>
                <ActionIcon variant="subtle" color="red" onClick={() => setRemoving(row)}>
                  <IconTrash size={18} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={editing !== null} onClose={() => setEditing(null)} title={t('banners.modalEdit')}>
        <Stack>
          <TextInput
            label={t('banners.imageUrl')}
            value={editForm.imageUrl}
            onChange={(e) => setEditForm((prev) => ({ ...prev, imageUrl: e.currentTarget.value }))}
          />
          <FileInput
            label={t('banners.uploadImage')}
            placeholder={t('banners.uploadImagePlaceholder')}
            accept="image/png,image/jpeg,image/webp,image/gif"
            leftSection={<IconUpload size={16} />}
            clearable
            disabled={uploading}
            onChange={(file) => void upload(file, 'edit')}
          />
          <TextInput
            label={t('banners.bannerTitle')}
            value={editForm.title}
            onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.currentTarget.value }))}
          />
          <TextInput
            label={t('banners.linkUrl')}
            value={editForm.linkUrl}
            onChange={(e) => setEditForm((prev) => ({ ...prev, linkUrl: e.currentTarget.value }))}
          />
          <Switch
            label={t('banners.active')}
            checked={editForm.isActive}
            onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.currentTarget.checked }))}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setEditing(null)}>
              {t('common.cancel')}
            </Button>
            <Button color="parfum" loading={updating || uploading} onClick={submitEdit}>
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </Modal>

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
