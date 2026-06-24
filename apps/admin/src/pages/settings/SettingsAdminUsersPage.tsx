import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import {
  useCreateAdminPanelUserMutation,
  useDeleteAdminPanelUserMutation,
  useGetAdminPanelUserQuery,
  useListAdminPanelUsersQuery,
  useUpdateAdminPanelUserMutation,
  type AdminPanelUserRow,
} from '../../app/parfumApi';

export function SettingsAdminUsersPage() {
  const { data, isLoading } = useListAdminPanelUsersQuery({ page: 1, pageSize: 100 });
  const [createUser, { isLoading: creating }] = useCreateAdminPanelUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateAdminPanelUserMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteAdminPanelUserMutation();
  const [editing, setEditing] = useState<AdminPanelUserRow | null>(null);
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const { data: detail } = useGetAdminPanelUserQuery(editing?.id ?? '', { skip: !editing });

  useEffect(() => {
    if (!editing) return;
    setEmail(detail?.email ?? editing.email);
    setPassword('');
    setFullName(detail?.fullName ?? editing.fullName ?? '');
    setIsActive(detail?.isActive ?? editing.isActive);
  }, [detail, editing]);

  function openCreate() {
    setEditing(null);
    setEmail('');
    setPassword('');
    setFullName('');
    setIsActive(true);
    setCreatingOpen(true);
  }

  function closeModal() {
    setEditing(null);
    setCreatingOpen(false);
  }

  async function submit() {
    try {
      if (editing) {
        await updateUser({
          id: editing.id,
          email,
          ...(password ? { password } : {}),
          fullName: fullName || null,
          isActive,
        }).unwrap();
      } else {
        await createUser({
          email,
          password,
          fullName: fullName || null,
          isActive,
        }).unwrap();
      }
      closeModal();
      notifications.show({ color: 'green', message: 'Admin user saved' });
    } catch {
      notifications.show({ color: 'red', message: 'Could not save admin user' });
    }
  }

  const modalOpen = creatingOpen || editing !== null;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={2}>Admin Users</Title>
          <Text c="dimmed" size="sm">
            Manage Super Admin accounts for the Ansor Market admin panel.
          </Text>
        </Stack>
        <Button color="parfum" onClick={openCreate}>
          New Admin
        </Button>
      </Group>

      {isLoading ? (
        <Text c="dimmed">Loading...</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Email</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(data?.items ?? []).map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{row.email}</Table.Td>
                <Table.Td>{row.fullName ?? '-'}</Table.Td>
                <Table.Td>
                  <Badge color="parfum" variant="light">
                    {row.isSuperAdmin ? 'Super Admin' : 'Admin'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color={row.isActive ? 'green' : 'gray'} variant="light">
                    {row.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group justify="flex-end" gap={4}>
                    <ActionIcon variant="subtle" onClick={() => setEditing(row)}>
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      loading={deleting}
                      onClick={async () => {
                        if (!window.confirm(`Delete ${row.email}?`)) return;
                        await deleteUser(row.id).unwrap();
                      }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={modalOpen} onClose={closeModal} title={editing ? 'Edit admin user' : 'New admin user'}>
        <Stack>
          <TextInput label="Email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
          <PasswordInput
            label="Password"
            value={password}
            placeholder={editing ? 'Leave blank to keep current password' : undefined}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <TextInput label="Full name" value={fullName} onChange={(e) => setFullName(e.currentTarget.value)} />
          <Switch label="Active" checked={isActive} onChange={(e) => setIsActive(e.currentTarget.checked)} />
          <Text size="xs" c="dimmed">
            New admin users are created as Super Admins by the backend.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeModal}>
              Cancel
            </Button>
            <Button color="parfum" loading={creating || updating} onClick={submit}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
