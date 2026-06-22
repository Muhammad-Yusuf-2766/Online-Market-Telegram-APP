import { Group, Pagination, Select, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { PAGE_SIZE_OPTIONS } from '../lib/useTablePagination';

export type TablePaginationFooterProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  rangeStart: number;
  rangeEnd: number;
  totalItems: number;
};

export function TablePaginationFooter({
  page,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  rangeStart,
  rangeEnd,
  totalItems,
}: TablePaginationFooterProps) {
  const { t } = useTranslation();

  if (totalItems === 0) {
    return null;
  }

  return (
    <Group justify="space-between" align="flex-end" gap="md" wrap="wrap" mt="sm">
      <Text size="sm" c="dimmed">
        {t('common.tableRowsRange', { start: rangeStart, end: rangeEnd, total: totalItems })}
      </Text>
      <Group gap="sm" align="flex-end" wrap="wrap">
        <Select
          size="sm"
          label={t('common.pageSize')}
          w={100}
          data={PAGE_SIZE_OPTIONS.map((n) => ({
            value: String(n),
            label: String(n),
          }))}
          value={String(pageSize)}
          onChange={(v) => v && onPageSizeChange(Number(v))}
        />
        <Pagination total={totalPages} value={page} onChange={onPageChange} size="sm" />
      </Group>
    </Group>
  );
}
