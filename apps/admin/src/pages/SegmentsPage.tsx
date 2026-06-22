import { Button, Code, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useCreateSegmentMutation,
  useGetSegmentsQuery,
  useSyncSegmentMembersMutation,
} from '../app/parfumApi';

export function SegmentsPage() {
  const { t } = useTranslation();
  const { data } = useGetSegmentsQuery();
  const [createSegment] = useCreateSegmentMutation();
  const [syncMembers, { isLoading: syncLoading }] = useSyncSegmentMembersMutation();
  const [name, setName] = useState('');
  const [definition, setDefinition] = useState('{"rule":"all"}');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  return (
    <Stack>
      <Title order={2}>{t('segments.title')}</Title>
      <Text size="sm" c="dimmed">
        {t('segments.subtitle')}
      </Text>
      <TextInput
        label={t('segments.name')}
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
      />
      <TextInput
        label={t('segments.definition')}
        description={t('segments.definitionHint')}
        value={definition}
        onChange={(e) => setDefinition(e.currentTarget.value)}
      />
      <Button
        onClick={() => {
          try {
            void createSegment({
              name,
              definition: JSON.parse(definition) as Record<string, unknown>,
            });
          } catch {
            // ignore parse error
          }
        }}
      >
        {t('segments.create')}
      </Button>
      <Table withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('segments.colName')}</Table.Th>
            <Table.Th>{t('segments.colCount')}</Table.Th>
            <Table.Th>{t('segments.colDefinition')}</Table.Th>
            <Table.Th w={160} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(data ?? []).map((row) => (
            <Table.Tr key={row.id}>
              <Table.Td>{row.name}</Table.Td>
              <Table.Td>{row.userCountCached}</Table.Td>
              <Table.Td>
                <Code>{JSON.stringify(row.definition)}</Code>
              </Table.Td>
              <Table.Td>
                <Button
                  size="xs"
                  variant="light"
                  loading={syncLoading && syncingId === row.id}
                  onClick={async () => {
                    setSyncingId(row.id);
                    try {
                      const r = await syncMembers(row.id).unwrap();
                      notifications.show({
                        title: t('segments.syncMembers'),
                        message: t('segments.syncDone', { count: r.synced }),
                        color: 'green',
                      });
                    } catch {
                      notifications.show({
                        title: t('segments.syncError'),
                        message: '',
                        color: 'red',
                      });
                    } finally {
                      setSyncingId(null);
                    }
                  }}
                >
                  {t('segments.syncMembers')}
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
