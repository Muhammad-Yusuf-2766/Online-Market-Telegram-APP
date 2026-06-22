import { Alert, Loader, Stack, Table, Text, Title } from '@mantine/core';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetCoinGiftsQuery } from '../app/parfumApi';
import { useListSearchParams } from '../shared/lib/useListSearchParams';
import { paginationFromTotal } from '../shared/lib/serverPagination';
import { TablePaginationFooter } from '../shared/ui/TablePaginationFooter';
import { formatPrice } from '../shared/lib/money';

export function CoinGiftsPage() {
  const { t } = useTranslation();
  const { page, setPage, pageSize, setPageSize } = useListSearchParams(25);
  const { data, isLoading, error } = useGetCoinGiftsQuery({ page, pageSize });

  const total = data?.total ?? 0;
  const { totalPages, rangeStart, rangeEnd, effectivePage } = paginationFromTotal(
    total,
    page,
    pageSize,
  );

  useEffect(() => {
    if (page !== effectivePage) {
      setPage(effectivePage);
    }
  }, [page, effectivePage, setPage]);

  const rows = (data?.items ?? []).map((g) => (
    <Table.Tr key={g.id}>
      <Table.Td>{dayjs(g.createdAt).format('YYYY-MM-DD HH:mm')}</Table.Td>
      <Table.Td>{g.title}</Table.Td>
      <Table.Td>{formatPrice(g.coins)}</Table.Td>
      <Table.Td>
        <Text size="sm" ff="monospace">
          {g.targetUser.telegramId}
        </Text>
      </Table.Td>
      <Table.Td>
        {[g.targetUser.firstName, g.targetUser.lastName].filter(Boolean).join(' ') || '—'}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="md">
      <Title order={2}>{t('coinGifts.title')}</Title>
      <Text size="sm" c="dimmed">
        {t('coinGifts.subtitle')}
      </Text>
      {error ? (
        <Alert color="red" title={t('coinGifts.loadErrorTitle')}>
          {t('coinGifts.loadErrorBody')}
        </Alert>
      ) : null}
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('coinGifts.colWhen')}</Table.Th>
                <Table.Th>{t('coinGifts.colTitle')}</Table.Th>
                <Table.Th>{t('coinGifts.colCoins')}</Table.Th>
                <Table.Th>{t('coinGifts.colTelegram')}</Table.Th>
                <Table.Th>{t('coinGifts.colName')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
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
