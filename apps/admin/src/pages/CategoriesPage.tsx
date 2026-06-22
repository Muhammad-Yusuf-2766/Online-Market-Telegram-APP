import { Button, Group, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateCategoryMutation, useGetCategoriesQuery } from '../app/parfumApi';

export function CategoriesPage() {
  const { t } = useTranslation();
  const { data } = useGetCategoriesQuery();
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');

  async function submit() {
    if (!slug.trim() || !name.trim()) return;
    try {
      await createCategory({ slug: slug.trim(), name: name.trim() }).unwrap();
      setSlug('');
      setName('');
      notifications.show({ color: 'green', title: t('common.create'), message: name });
    } catch {
      notifications.show({ color: 'red', title: t('common.error'), message: '' });
    }
  }

  return (
    <Stack>
      <Title order={2}>{t('categories.title')}</Title>
      <Text size="sm" c="dimmed">
        {t('categories.subtitle')}
      </Text>
      <Group align="flex-end">
        <TextInput
          label={t('categories.slug')}
          value={slug}
          onChange={(e) => setSlug(e.currentTarget.value)}
        />
        <TextInput
          label={t('categories.name')}
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <Button color="parfum" loading={creating} onClick={submit}>
          {t('categories.create')}
        </Button>
      </Group>
      <Table withTableBorder striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('categories.slug')}</Table.Th>
            <Table.Th>{t('categories.name')}</Table.Th>
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
