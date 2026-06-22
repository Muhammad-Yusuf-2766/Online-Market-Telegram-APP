import { Button, Group, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateBrandMutation, useGetBrandsQuery } from '../app/parfumApi';

export function BrandsPage() {
  const { t } = useTranslation();
  const { data } = useGetBrandsQuery();
  const [createBrand, { isLoading: creating }] = useCreateBrandMutation();
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');

  async function submit() {
    if (!slug.trim() || !name.trim()) return;
    try {
      await createBrand({ slug: slug.trim(), name: name.trim() }).unwrap();
      setSlug('');
      setName('');
      notifications.show({ color: 'green', title: t('common.create'), message: name });
    } catch {
      notifications.show({ color: 'red', title: t('common.error'), message: '' });
    }
  }

  return (
    <Stack>
      <Title order={2}>{t('brands.title')}</Title>
      <Text size="sm" c="dimmed">
        {t('brands.subtitle')}
      </Text>
      <Group align="flex-end">
        <TextInput
          label={t('brands.slug')}
          value={slug}
          onChange={(e) => setSlug(e.currentTarget.value)}
        />
        <TextInput
          label={t('brands.name')}
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <Button color="parfum" loading={creating} onClick={submit}>
          {t('brands.create')}
        </Button>
      </Group>
      <Table withTableBorder striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('brands.slug')}</Table.Th>
            <Table.Th>{t('brands.name')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(data ?? []).map((row) => (
            <Table.Tr key={row.id}>
              <Table.Td>{row.slug}</Table.Td>
              <Table.Td>{row.name}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
