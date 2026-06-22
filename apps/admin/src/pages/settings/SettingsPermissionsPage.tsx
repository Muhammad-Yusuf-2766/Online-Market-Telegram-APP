import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useCreatePermissionMutation,
  useDeletePermissionMutation,
  useListPermissionsQuery,
  useUpdatePermissionMutation,
  type PermissionRow,
} from '../../app/parfumApi';
import { Can } from '../../features/auth/RequirePermission';
import { PERM } from '../../features/auth/permissions';
import { usePermissionLabel } from '../../features/settings/usePermissionLabel';

export function SettingsPermissionsPage() {
  const { t } = useTranslation();
  const permissionLabel = usePermissionLabel();
  const { data = [], isLoading } = useListPermissionsQuery();
  const [createPermission] = useCreatePermissionMutation();
  const [updatePermission] = useUpdatePermissionMutation();
  const [deletePermission] = useDeletePermissionMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<PermissionRow | null>(null);
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const openCreate = () => {
    setKey('');
    setName('');
    setDescription('');
    setCreateOpen(true);
  };

  const openEdit = (row: PermissionRow) => {
    setEditRow(row);
    setKey(row.key);
    setName(row.name);
    setDescription(row.description ?? '');
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Stack gap={4}>
          <Title order={2}>{t('settings.permissions.title')}</Title>
          <Text c="dimmed" size="sm">
            {t('settings.permissions.subtitle')}
          </Text>
        </Stack>
        <Can perm={PERM.settings.permissions.manage}>
          <Button color="parfum" onClick={openCreate}>
            {t('settings.permissions.create')}
          </Button>
        </Can>
      </Group>

      {isLoading ? (
        <Text>{t('common.loading')}</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('settings.permissions.key')}</Table.Th>
              <Table.Th>{t('settings.permissions.name')}</Table.Th>
              <Table.Th>{t('settings.permissions.description')}</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <Group gap="xs">
                    <Text size="sm" ff="monospace">
                      {row.key}
                    </Text>
                    {row.isSystem && (
                      <Badge size="xs" variant="light">
                        {t('settings.permissions.system')}
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>{permissionLabel(row)}</Table.Td>
                <Table.Td>{row.description ?? t('common.dash')}</Table.Td>
                <Table.Td>
                  <Can perm={PERM.settings.permissions.manage}>
                    <Group gap={4} justify="flex-end">
                      <ActionIcon variant="subtle" onClick={() => openEdit(row)}>
                        <IconPencil size={16} />
                      </ActionIcon>
                      {!row.isSystem && (
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={async () => {
                            if (window.confirm(t('settings.permissions.confirmDelete'))) {
                              await deletePermission(row.id).unwrap();
                            }
                          }}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Can>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={createOpen || Boolean(editRow)}
        onClose={() => {
          setCreateOpen(false);
          setEditRow(null);
        }}
        title={
          editRow
            ? t('settings.permissions.name')
            : t('settings.permissions.create')
        }
      >
        <Stack>
          <TextInput
            label={t('settings.permissions.key')}
            value={key}
            onChange={(e) => setKey(e.currentTarget.value)}
            disabled={Boolean(editRow?.isSystem)}
          />
          <TextInput
            label={t('settings.permissions.name')}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <Textarea
            label={t('settings.permissions.description')}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />
          <Button
            color="parfum"
            onClick={async () => {
              if (editRow) {
                await updatePermission({
                  id: editRow.id,
                  ...(!editRow.isSystem ? { key } : {}),
                  name,
                  description: description || null,
                }).unwrap();
              } else {
                await createPermission({
                  key,
                  name,
                  description: description || undefined,
                }).unwrap();
              }
              setCreateOpen(false);
              setEditRow(null);
            }}
          >
            {t('common.save')}
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
