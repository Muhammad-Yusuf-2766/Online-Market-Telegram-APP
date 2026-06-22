import {
  Badge,
  Button,
  Checkbox,
  Group,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import {
  useGetRoleQuery,
  useListPermissionsQuery,
  useSetRolePermissionsMutation,
  useUpdateRoleMutation,
} from '../../app/parfumApi';
import { Can } from '../../features/auth/RequirePermission';
import { PERM } from '../../features/auth/permissions';
import { groupPermissionsByNamespace } from '../../features/settings/groupPermissions';
import { usePermissionLabel } from '../../features/settings/usePermissionLabel';

export function SettingsRoleDetailPage() {
  const { t } = useTranslation();
  const permissionLabel = usePermissionLabel();
  const { id = '' } = useParams();
  const { data: role, isLoading } = useGetRoleQuery(id, { skip: !id });
  const { data: allPermissions = [] } = useListPermissionsQuery();
  const [updateRole] = useUpdateRoleMutation();
  const [setRolePermissions] = useSetRolePermissionsMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!role) return;
    setName(role.name);
    setDescription(role.description ?? '');
    setSelected(role.permissions.map((p) => p.id));
  }, [role]);

  const groups = useMemo(
    () => groupPermissionsByNamespace(allPermissions),
    [allPermissions],
  );

  if (isLoading || !role) {
    return <Text>{t('common.loading')}</Text>;
  }

  const readonlyPerms = role.isSuperAdmin;

  return (
    <Stack gap="md">
      <Text component={Link} to="/settings/roles" size="sm" c="parfum.8">
            ← {t('settings.roles.title')}
      </Text>
      <Title order={2}>{t('settings.roles.detailTitle', { name: role.name })}</Title>

      <Group gap="xs">
        <Badge>{role.key}</Badge>
        {role.isSystem && <Badge variant="light">{t('settings.roles.system')}</Badge>}
      </Group>

      <TextInput
        label={t('settings.roles.name')}
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        disabled={!role.isSystem && false}
      />
      <Textarea
        label={t('settings.roles.description')}
        value={description}
        onChange={(e) => setDescription(e.currentTarget.value)}
      />

      <Can perm={PERM.settings.roles.manage}>
        <Button
          color="parfum"
          w="fit-content"
          onClick={async () => {
            await updateRole({
              id: role.id,
              name,
              description: description || null,
            }).unwrap();
          }}
        >
          {t('common.save')}
        </Button>
      </Can>

      <Title order={4}>{t('settings.roles.permissions')}</Title>
      {readonlyPerms && (
        <Text c="dimmed" size="sm">
          {t('settings.roles.superAdminReadonly')}
        </Text>
      )}

      {groups.map((g) => (
        <Stack key={g.namespace} gap="xs">
          <Text fw={600} tt="uppercase" size="xs" c="dimmed">
            {g.namespace}
          </Text>
          {g.items.map((p) => (
            <Checkbox
              key={p.id}
              label={`${permissionLabel(p)} (${p.key})`}
              checked={selected.includes(p.id)}
              disabled={readonlyPerms}
              onChange={(e) => {
                setSelected((prev) =>
                  e.currentTarget.checked
                    ? [...prev, p.id]
                    : prev.filter((x) => x !== p.id),
                );
              }}
            />
          ))}
        </Stack>
      ))}

      <Can perm={PERM.settings.roles.manage}>
        {!readonlyPerms && (
          <Button
            color="parfum"
            w="fit-content"
            onClick={async () => {
              await setRolePermissions({ id: role.id, permissionIds: selected }).unwrap();
            }}
          >
            {t('common.save')}
          </Button>
        )}
      </Can>
    </Stack>
  );
}
