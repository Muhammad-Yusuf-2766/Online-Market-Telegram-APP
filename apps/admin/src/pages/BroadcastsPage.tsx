import {
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Select } from '@mantine/core';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useListSearchParams } from '../shared/lib/useListSearchParams';
import { paginationFromTotal } from '../shared/lib/serverPagination';
import { TablePaginationFooter } from '../shared/ui/TablePaginationFooter';
import {
  type BroadcastRow,
  useCreateBroadcastMutation,
  useGetBroadcastsQuery,
  useGetSegmentsQuery,
  useSendBroadcastNowMutation,
} from '../app/parfumApi';

const STATUS_COLORS: Record<BroadcastRow['status'], string> = {
  DRAFT: 'gray',
  SCHEDULED: 'blue',
  SENDING: 'yellow',
  SENT: 'green',
  FAILED: 'red',
};

export function BroadcastsPage() {
  const { t } = useTranslation();
  const { page, setPage, pageSize, setPageSize } = useListSearchParams(25);
  const { data, isLoading } = useGetBroadcastsQuery({ page, pageSize });

  const total = data?.total ?? 0;
  const { totalPages, rangeStart, rangeEnd, effectivePage } = paginationFromTotal(
    total,
    page,
    pageSize,
  );

  useEffect(() => {
    if (page !== effectivePage) setPage(effectivePage);
  }, [page, effectivePage, setPage]);

  const broadcasts = data?.items ?? [];
  const { data: segments } = useGetSegmentsQuery();
  const [createBroadcast, { isLoading: creating }] = useCreateBroadcastMutation();
  const [sendNow] = useSendBroadcastNowMutation();
  const [sendingId, setSendingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [segmentId, setSegmentId] = useState<string | null>(null);
  const [bodyUz, setBodyUz] = useState('');
  const [bodyRu, setBodyRu] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const segmentOptions = useMemo(
    () => (segments ?? []).map((s) => ({ value: s.id, label: s.name })),
    [segments],
  );

  const selectedSegment = useMemo(
    () => (segments ?? []).find((s) => s.id === segmentId) ?? null,
    [segments, segmentId],
  );

  function resetForm() {
    setTitle('');
    setSegmentId(null);
    setBodyUz('');
    setBodyRu('');
    setImageUrl('');
  }

  async function handleCreate() {
    if (!title.trim()) {
      notifications.show({ color: 'orange', title: t('broadcasts.validationTitle'), message: '' });
      return;
    }
    if (!segmentId) {
      notifications.show({ color: 'orange', title: t('broadcasts.validationSegment'), message: '' });
      return;
    }
    if (!bodyUz.trim() && !bodyRu.trim()) {
      notifications.show({ color: 'orange', title: t('broadcasts.validationBody'), message: '' });
      return;
    }
    try {
      await createBroadcast({
        title: title.trim(),
        segmentId,
        bodyUz: bodyUz.trim() || bodyRu.trim(),
        bodyRu: bodyRu.trim() || bodyUz.trim(),
        ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
      }).unwrap();
      notifications.show({
        color: 'green',
        title: t('broadcasts.createdTitle'),
        message: t('broadcasts.createdBody'),
      });
      resetForm();
    } catch {
      notifications.show({ color: 'red', title: t('broadcasts.createError'), message: '' });
    }
  }

  async function handleSend(id: string) {
    setSendingId(id);
    try {
      const r = await sendNow(id).unwrap();
      if (r.sent === 0) {
        notifications.show({
          color: 'orange',
          title: t('broadcasts.sentTitle'),
          message: t('broadcasts.sentZero'),
        });
      } else {
        notifications.show({
          color: 'green',
          title: t('broadcasts.sentTitle'),
          message: t('broadcasts.sentBody', { count: r.sent }),
        });
      }
    } catch {
      notifications.show({ color: 'red', title: t('broadcasts.sendError'), message: '' });
    } finally {
      setSendingId(null);
    }
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>{t('broadcasts.title')}</Title>
        <Text size="sm" c="dimmed">
          {t('broadcasts.subtitle')}
        </Text>
      </div>

      <Card withBorder padding="lg" radius="md">
        <Stack gap="sm">
          <TextInput
            label={t('broadcasts.titleField')}
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            required
          />
          <Select
            label={t('broadcasts.segment')}
            value={segmentId}
            onChange={setSegmentId}
            data={segmentOptions}
            searchable
            clearable
            nothingFoundMessage="—"
          />
          {selectedSegment ? (
            <Group gap="xs">
              <Badge color="teal" variant="light">
                {t('broadcasts.segmentMembers', { count: selectedSegment.userCountCached })}
              </Badge>
              {selectedSegment.userCountCached === 0 ? (
                <Text size="xs" c="dimmed">
                  {t('broadcasts.segmentEmpty')}
                </Text>
              ) : null}
            </Group>
          ) : (
            <Text size="xs" c="dimmed">
              {t('broadcasts.segmentNoSelected')}
            </Text>
          )}

          <Group grow align="flex-start">
            <Textarea
              label={t('broadcasts.bodyUz')}
              value={bodyUz}
              onChange={(e) => setBodyUz(e.currentTarget.value)}
              autosize
              minRows={3}
            />
            <Textarea
              label={t('broadcasts.bodyRu')}
              value={bodyRu}
              onChange={(e) => setBodyRu(e.currentTarget.value)}
              autosize
              minRows={3}
            />
          </Group>
          <Text size="xs" c="dimmed">
            {t('broadcasts.bodyHint')}
          </Text>

          <TextInput
            label={t('broadcasts.imageUrl')}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.currentTarget.value)}
          />

          <Group justify="flex-end">
            <Button color="parfum" loading={creating} onClick={handleCreate}>
              {t('broadcasts.create')}
            </Button>
          </Group>
        </Stack>
      </Card>

      {isLoading ? (
        <Loader />
      ) : (
        <>
          <Table withTableBorder striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('broadcasts.colTitle')}</Table.Th>
                <Table.Th>{t('broadcasts.colSegment')}</Table.Th>
                <Table.Th>{t('broadcasts.colStatus')}</Table.Th>
                <Table.Th>{t('broadcasts.colSent')}</Table.Th>
                <Table.Th>{t('broadcasts.colError')}</Table.Th>
                <Table.Th>{t('broadcasts.colCreated')}</Table.Th>
                <Table.Th>{t('broadcasts.colActions')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {broadcasts.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>
                    <Text fw={500}>{row.title}</Text>
                    {row.scheduledFor ? (
                      <Text size="xs" c="dimmed">
                        {dayjs(row.scheduledFor).format('YYYY-MM-DD HH:mm')}
                      </Text>
                    ) : null}
                  </Table.Td>
                  <Table.Td>{row.segment?.name ?? '—'}</Table.Td>
                  <Table.Td>
                    <Badge color={STATUS_COLORS[row.status]} variant="light">
                      {t(`broadcastStatus.${row.status}` as const, row.status)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{row.sentCount}</Table.Td>
                  <Table.Td>{row.errorCount > 0 ? row.errorCount : '—'}</Table.Td>
                  <Table.Td>
                    <Text size="xs">{dayjs(row.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      color="parfum"
                      loading={sendingId === row.id}
                      disabled={row.status === 'SENT' || row.status === 'SENDING'}
                      onClick={() => handleSend(row.id)}
                    >
                      {sendingId === row.id ? t('broadcasts.sending') : t('broadcasts.sendNow')}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
              {broadcasts.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text size="sm" c="dimmed" ta="center" py="md">
                      —
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
          {total > 0 ? (
            <TablePaginationFooter
              page={effectivePage}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              totalItems={total}
            />
          ) : null}
        </>
      )}
    </Stack>
  );
}
