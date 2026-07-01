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
      notifications.show({ color: 'green', message: 'Administrator saqlandi.' });
    } catch {
      notifications.show({ color: 'red', message: 'Administratorni saqlab bo‘lmadi.' });
    }
  }

  const modalOpen = creatingOpen || editing !== null;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={2}>Administratorlar</Title>
          <Text c="dimmed" size="sm">
            Ansor Market admin paneli uchun Super Admin hisoblarini boshqarish.
          </Text>
        </Stack>
        <Button color="parfum" onClick={openCreate}>
          Yangi administrator
        </Button>
      </Group>

      {isLoading ? (
        <Text c="dimmed">Yuklanmoqda...</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Elektron pochta</Table.Th>
              <Table.Th>Ism</Table.Th>
              <Table.Th>Turi</Table.Th>
              <Table.Th>Holati</Table.Th>
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
                    {row.isSuperAdmin ? 'Super Admin' : 'Administrator'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color={row.isActive ? 'green' : 'gray'} variant="light">
                    {row.isActive ? 'Faol' : 'Nofaol'}
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
                        if (!window.confirm(`«${row.email}» administrator hisobi o‘chirilsinmi?`)) return;
                        await deleteUser(row.id).unwrap();
                        notifications.show({ color: 'green', message: 'Administrator o‘chirildi.' });
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
      {!isLoading && (data?.items?.length ?? 0) === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="md">
          Administratorlar topilmadi.
        </Text>
      ) : null}

      <Modal opened={modalOpen} onClose={closeModal} title={editing ? 'Administratorni tahrirlash' : 'Yangi administrator'}>
        <Stack>
          <TextInput label="Elektron pochta" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
          <PasswordInput
            label="Parol"
            value={password}
            placeholder={editing ? 'Joriy parolni saqlash uchun bo‘sh qoldiring' : undefined}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <TextInput label="To‘liq ism" value={fullName} onChange={(e) => setFullName(e.currentTarget.value)} />
          <Switch label="Faol" checked={isActive} onChange={(e) => setIsActive(e.currentTarget.checked)} />
          <Text size="xs" c="dimmed">
            Yangi administratorlar backend tomonidan Super Admin sifatida yaratiladi.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeModal}>
              Bekor qilish
            </Button>
            <Button color="parfum" loading={creating || updating} onClick={submit}>
              Saqlash
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
