import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  PasswordInput,
  Select,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useCreateAdminPanelUserMutation,
  useDeleteAdminPanelUserMutation,
  useGetAdminPanelUserQuery,
  useListAdminPanelUsersQuery,
  useListPermissionsQuery,
  useListRolesQuery,
  useSetAdminPanelUserPermissionsMutation,
  useUpdateAdminPanelUserMutation,
  type AdminPanelUserRow,
} from '../../app/parfumApi';
import { Can } from '../../features/auth/RequirePermission';
import { PERM } from '../../features/auth/permissions';
import { groupPermissionsByNamespace } from '../../features/settings/groupPermissions';
import { usePermissionLabel } from '../../features/settings/usePermissionLabel';
import { useListSearchParams } from '../../shared/lib/useListSearchParams';
import { paginationFromTotal } from '../../shared/lib/serverPagination';
import { TablePaginationFooter } from '../../shared/ui/TablePaginationFooter';

export function SettingsAdminUsersPage() {
  const { t } = useTranslation();
  const permissionLabel = usePermissionLabel();
  const { page, setPage, pageSize, setPageSize } = useListSearchParams(20);
  const [q, setQ] = useState('');
  const { data, isLoading } = useListAdminPanelUsersQuery({ page, pageSize, q: q || undefined });
  const { data: roles = [] } = useListRolesQuery();
  const { data: allPermissions = [] } = useListPermissionsQuery();

  const [createUser] = useCreateAdminPanelUserMutation();
  const [updateUser] = useUpdateAdminPanelUserMutation();
  const [deleteUser] = useDeleteAdminPanelUserMutation();
  const [setPermissions] = useSetAdminPanelUserPermissionsMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { data: editUser } = useGetAdminPanelUserQuery(editId ?? '', { skip: !editId });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [roleId, setRoleId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const groups = useMemo(
    () => groupPermissionsByNamespace(allPermissions),
    [allPermissions],
  );

  useEffect(() => {
    if (!editUser) return;
    setEmail(editUser.email);
    setPassword('');
    setFullName(editUser.fullName ?? '');
    setRoleId(editUser.role?.id ?? null);
    setIsActive(editUser.isActive);
    setSelectedPerms(editUser.directPermissions.map((p) => p.id));
  }, [editUser]);

  const openCreate = () => {
    setEditId(null);
    setEmail('');
    setPassword('');
    setFullName('');
    setRoleId(null);
    setIsActive(true);
    setSelectedPerms([]);
    setModalOpen(true);
  };

  const openEdit = (row: AdminPanelUserRow) => {
    setEditId(row.id);
    setModalOpen(true);
  };

  const total = data?.total ?? 0;
  const { totalPages, rangeStart, rangeEnd, effectivePage } = paginationFromTotal(
    total,
    page,
    pageSize,
  );

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Stack gap={4}>
          <Title order={2}>{t('settings.adminUsers.title')}</Title>
          <Text c="dimmed" size="sm">
            {t('settings.adminUsers.subtitle')}
          </Text>
        </Stack>
        <Can perm={PERM.settings.users.manage}>
          <Button color="parfum" onClick={openCreate}>
            {t('settings.adminUsers.create')}
          </Button>
        </Can>
      </Group>

      <TextInput
        label={t('settings.adminUsers.search')}
        value={q}
        onChange={(e) => {
          setQ(e.currentTarget.value);
          setPage(1);
        }}
      />

      {isLoading ? (
        <Text>{t('common.loading')}</Text>
      ) : (
        <>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('settings.adminUsers.email')}</Table.Th>
                <Table.Th>{t('settings.adminUsers.fullName')}</Table.Th>
                <Table.Th>{t('settings.adminUsers.role')}</Table.Th>
                <Table.Th>{t('common.status')}</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data?.items ?? []).map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{row.email}</Table.Td>
                  <Table.Td>{row.fullName ?? t('common.dash')}</Table.Td>
                  <Table.Td>
                    {row.role ? (
                      <Group gap="xs">
                        <Text size="sm">{row.role.name}</Text>
                        {row.role.isSuperAdmin && (
                          <Badge size="xs">{t('settings.adminUsers.systemRole')}</Badge>
                        )}
                      </Group>
                    ) : (
                      t('common.dash')
                    )}
                  </Table.Td>
                  <Table.Td>
                    {row.isActive ? (
                      <Badge color="green" variant="light">
                        {t('common.active')}
                      </Badge>
                    ) : (
                      <Badge color="gray" variant="light">
                        {t('settings.adminUsers.inactive')}
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Can perm={PERM.settings.users.manage}>
                      <Group gap={4} justify="flex-end">
                        <ActionIcon variant="subtle" onClick={() => openEdit(row)}>
                          <IconPencil size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={async () => {
                            if (window.confirm(t('settings.adminUsers.confirmDelete'))) {
                              await deleteUser(row.id).unwrap();
                            }
                          }}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Can>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <TablePaginationFooter
            page={effectivePage}
            totalPages={totalPages}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? t('settings.adminUsers.edit') : t('settings.adminUsers.create')}
        size="lg"
      >
        <Tabs defaultValue="general">
          <Tabs.List>
            <Tabs.Tab value="general">{t('settings.adminUsers.tabGeneral')}</Tabs.Tab>
            <Tabs.Tab value="permissions">{t('settings.adminUsers.tabPermissions')}</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="general" pt="md">
            <Stack>
              <TextInput
                label={t('settings.adminUsers.email')}
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
              />
              <PasswordInput
                label={t('settings.adminUsers.password')}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                placeholder={editId ? '••••••' : undefined}
              />
              <TextInput
                label={t('settings.adminUsers.fullName')}
                value={fullName}
                onChange={(e) => setFullName(e.currentTarget.value)}
              />
              <Select
                label={t('settings.adminUsers.role')}
                data={roles.map((r) => ({ value: r.id, label: r.name }))}
                value={roleId}
                onChange={setRoleId}
                clearable
              />
              <Switch
                label={t('common.active')}
                checked={isActive}
                onChange={(e) => setIsActive(e.currentTarget.checked)}
              />
              <Button
                color="parfum"
                onClick={async () => {
                  if (editId) {
                    await updateUser({
                      id: editId,
                      email,
                      ...(password ? { password } : {}),
                      fullName: fullName || null,
                      roleId,
                      isActive,
                    }).unwrap();
                  } else {
                    await createUser({
                      email,
                      password,
                      fullName: fullName || undefined,
                      roleId: roleId ?? undefined,
                      isActive,
                    }).unwrap();
                  }
                  setModalOpen(false);
                }}
              >
                {t('common.save')}
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="permissions" pt="md">
            <Stack>
              <Text size="sm" c="dimmed">
                {t('settings.adminUsers.directPermissionsHint')}
              </Text>
              {groups.map((g) => (
                <Stack key={g.namespace} gap={4}>
                  <Text fw={600} size="xs" tt="uppercase" c="dimmed">
                    {g.namespace}
                  </Text>
                  {g.items.map((p) => (
                    <Switch
                      key={p.id}
                      label={`${permissionLabel(p)} (${p.key})`}
                      checked={selectedPerms.includes(p.id)}
                      onChange={(e) => {
                        setSelectedPerms((prev) =>
                          e.currentTarget.checked
                            ? [...prev, p.id]
                            : prev.filter((x) => x !== p.id),
                        );
                      }}
                    />
                  ))}
                </Stack>
              ))}
              {editId && (
                <Button
                  color="parfum"
                  onClick={async () => {
                    await setPermissions({
                      id: editId,
                      permissionIds: selectedPerms,
                    }).unwrap();
                    setModalOpen(false);
                  }}
                >
                  {t('common.save')}
                </Button>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Modal>
    </Stack>
  );
}
