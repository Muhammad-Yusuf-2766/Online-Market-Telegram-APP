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
import { IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useListRolesQuery,
  type RoleRow,
} from '../../app/parfumApi';
import { Can } from '../../features/auth/RequirePermission';
import { PERM } from '../../features/auth/permissions';

export function SettingsRolesPage() {
  const { t } = useTranslation();
  const { data = [], isLoading } = useListRolesQuery();
  const [createRole] = useCreateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Stack gap={4}>
          <Title order={2}>{t('settings.roles.title')}</Title>
          <Text c="dimmed" size="sm">
            {t('settings.roles.subtitle')}
          </Text>
        </Stack>
        <Can perm={PERM.settings.roles.manage}>
          <Button color="parfum" onClick={() => setCreateOpen(true)}>
            {t('settings.roles.create')}
          </Button>
        </Can>
      </Group>

      {isLoading ? (
        <Text>{t('common.loading')}</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('settings.roles.key')}</Table.Th>
              <Table.Th>{t('settings.roles.name')}</Table.Th>
              <Table.Th>{t('settings.roles.members')}</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((row: RoleRow) => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <Group gap="xs">
                    <Text size="sm" ff="monospace">
                      {row.key}
                    </Text>
                    {row.isSystem && (
                      <Badge size="xs" variant="light">
                        {t('settings.roles.system')}
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text
                    component={Link}
                    to={`/settings/roles/${row.id}`}
                    c="parfum.8"
                    fw={500}
                  >
                    {row.name}
                  </Text>
                </Table.Td>
                <Table.Td>{row.memberCount}</Table.Td>
                <Table.Td>
                  <Can perm={PERM.settings.roles.manage}>
                    {!row.isSystem && (
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={async () => {
                          if (window.confirm(t('settings.roles.confirmDelete'))) {
                            await deleteRole(row.id).unwrap();
                          }
                        }}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    )}
                  </Can>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title={t('settings.roles.create')}>
        <Stack>
          <TextInput
            label={t('settings.roles.key')}
            placeholder="custom_role"
            value={key}
            onChange={(e) => setKey(e.currentTarget.value)}
          />
          <TextInput
            label={t('settings.roles.name')}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <Textarea
            label={t('settings.roles.description')}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />
          <Button
            color="parfum"
            onClick={async () => {
              await createRole({ key, name, description: description || undefined }).unwrap();
              setCreateOpen(false);
              setKey('');
              setName('');
              setDescription('');
            }}
          >
            {t('common.save')}
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
