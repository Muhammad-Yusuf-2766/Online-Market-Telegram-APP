import { Alert, Loader, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetCoinLedgerQuery } from '../app/parfumApi';
import { useListSearchParams } from '../shared/lib/useListSearchParams';
import { paginationFromTotal } from '../shared/lib/serverPagination';
import { TablePaginationFooter } from '../shared/ui/TablePaginationFooter';
import { formatPrice } from '../shared/lib/money';

export function CoinLedgerPage() {
  const { t } = useTranslation();
  const { page, setPage, pageSize, setPageSize } = useListSearchParams(25);
  const [userIdFilter, setUserIdFilter] = useState('');
  const { data, isLoading, error } = useGetCoinLedgerQuery({
    page,
    pageSize,
    userId: userIdFilter.trim() || undefined,
  });

  const total = data?.total ?? 0;
  const { totalPages, rangeStart, rangeEnd, effectivePage } = paginationFromTotal(total, page, pageSize);

  useEffect(() => {
    if (page !== effectivePage) setPage(effectivePage);
  }, [effectivePage, page, setPage]);

  return (
    <Stack gap="md">
      <Title order={2}>{t('coinLedger.title')}</Title>
      <Text c="dimmed" size="sm">
        {t('coinLedger.subtitle')}
      </Text>
      <TextInput
        label={t('coinLedger.userIdLabel')}
        value={userIdFilter}
        onChange={(e) => {
          setUserIdFilter(e.currentTarget.value);
          setPage(1);
        }}
      />
      {error ? (
        <Alert color="red" title={t('coinLedger.loadErrorTitle')}>
          {t('coinLedger.loadErrorBody')}
        </Alert>
      ) : null}
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('coinLedger.colWhen')}</Table.Th>
                <Table.Th>{t('coinLedger.colUserId')}</Table.Th>
                <Table.Th>{t('coinLedger.colKind')}</Table.Th>
                <Table.Th>{t('coinLedger.colDelta')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data?.items ?? []).map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{dayjs(row.createdAt).format('YYYY-MM-DD HH:mm')}</Table.Td>
                  <Table.Td>
                    <Text ff="monospace" size="sm">
                      {row.userId}
                    </Text>
                  </Table.Td>
                  <Table.Td>{t(`coinLedger.kind.${row.kind}` as const, row.kind)}</Table.Td>
                  <Table.Td c={row.delta >= 0 ? 'teal' : 'red'}>{formatPrice(row.delta)}</Table.Td>
                </Table.Tr>
              ))}
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
