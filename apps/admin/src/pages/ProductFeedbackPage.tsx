import {
  Button,
  Group,
  Loader,
  Pagination,
  Paper,
  SegmentedControl,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useListProductFeedbackQuery,
  usePatchProductFeedbackStatusMutation,
  type ProductFeedbackStatus,
} from '../app/parfumApi';

const PAGE_SIZE = 15;

export function ProductFeedbackPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ProductFeedbackStatus>('PENDING');
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error } = useListProductFeedbackQuery({
    page,
    pageSize: PAGE_SIZE,
    status,
  });
  const [patchStatus, { isLoading: patching }] = usePatchProductFeedbackStatusMutation();

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <Stack gap="md">
      <Title order={3}>{t('productFeedback.title')}</Title>
      <SegmentedControl
        value={status}
        onChange={(v) => {
          setStatus(v as ProductFeedbackStatus);
          setPage(1);
        }}
        data={[
          { label: t('productFeedback.filterPending'), value: 'PENDING' },
          { label: t('productFeedback.filterApproved'), value: 'APPROVED' },
          { label: t('productFeedback.filterRejected'), value: 'REJECTED' },
        ]}
      />
      {error ? (
        <Text c="red" size="sm">
          {t('productFeedback.loadError')}
        </Text>
      ) : null}
      <Paper withBorder p="md" radius="md">
        {isLoading && !data ? (
          <Group justify="center" p="xl">
            <Loader />
          </Group>
        ) : (
          <>
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('productFeedback.colProduct')}</Table.Th>
                  <Table.Th>{t('productFeedback.colUser')}</Table.Th>
                  <Table.Th>{t('productFeedback.colStars')}</Table.Th>
                  <Table.Th>{t('productFeedback.colComment')}</Table.Th>
                  <Table.Th>{t('productFeedback.colActions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(data?.items ?? []).map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {row.product.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {row.product.id}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{row.user.firstName ?? '—'}</Text>
                      <Text size="xs" c="dimmed">
                        {row.user.telegramUsername
                          ? `@${row.user.telegramUsername}`
                          : row.user.id}
                      </Text>
                    </Table.Td>
                    <Table.Td>{row.stars}</Table.Td>
                    <Table.Td style={{ maxWidth: 280 }}>
                      <Text size="sm" lineClamp={4}>
                        {row.comment || '—'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {row.status === 'PENDING' ? (
                        <Group gap="xs" wrap="nowrap">
                          <Button
                            size="xs"
                            color="green"
                            variant="light"
                            loading={patching}
                            onClick={() => {
                              void patchStatus({ id: row.id, status: 'APPROVED' })
                                .unwrap()
                                .then(() => {
                                  notifications.show({
                                    color: 'green',
                                    message: t('productFeedback.approved'),
                                  });
                                })
                                .catch(() => {
                                  notifications.show({
                                    color: 'red',
                                    message: t('productFeedback.actionError'),
                                  });
                                });
                            }}
                          >
                            {t('productFeedback.approve')}
                          </Button>
                          <Button
                            size="xs"
                            color="red"
                            variant="light"
                            loading={patching}
                            onClick={() => {
                              void patchStatus({ id: row.id, status: 'REJECTED' })
                                .unwrap()
                                .then(() => {
                                  notifications.show({
                                    color: 'gray',
                                    message: t('productFeedback.rejected'),
                                  });
                                })
                                .catch(() => {
                                  notifications.show({
                                    color: 'red',
                                    message: t('productFeedback.actionError'),
                                  });
                                });
                            }}
                          >
                            {t('productFeedback.reject')}
                          </Button>
                        </Group>
                      ) : (
                        <Text size="xs" c="dimmed">
                          {row.status}
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {(data?.items?.length ?? 0) === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="md">
                {t('productFeedback.empty')}
              </Text>
            ) : null}
            {totalPages > 1 ? (
              <Group justify="center" mt="md">
                <Pagination
                  total={totalPages}
                  value={page}
                  onChange={setPage}
                  disabled={isFetching}
                />
              </Group>
            ) : null}
          </>
        )}
      </Paper>
    </Stack>
  );
}
