import { Button, Group, Paper, SimpleGrid, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useGetFinanceReportQuery } from '../app/parfumApi';
import { formatPrice } from '../shared/lib/money';

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
        {label}
      </Text>
      <Text size="xl" fw={700} mt={4}>
        {value}
      </Text>
      {hint ? (
        <Text size="xs" c="dimmed" mt={4}>
          {hint}
        </Text>
      ) : null}
    </Paper>
  );
}

export function FinancePage() {
  const [draftFrom, setDraftFrom] = useState(dayjs().subtract(29, 'day').format('YYYY-MM-DD'));
  const [draftTo, setDraftTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [range, setRange] = useState({ from: draftFrom, to: draftTo });
  const { data, isFetching } = useGetFinanceReportQuery(range);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={2}>Finance</Title>
          <Text c="dimmed" size="sm">
            KRW order totals grouped by day, status, product, and category.
          </Text>
        </Stack>
        <Group align="flex-end">
          <TextInput label="From" type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.currentTarget.value)} />
          <TextInput label="To" type="date" value={draftTo} onChange={(e) => setDraftTo(e.currentTarget.value)} />
          <Button color="parfum" loading={isFetching} onClick={() => setRange({ from: draftFrom, to: draftTo })}>
            Apply
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Kpi label="Gross revenue" value={data ? formatPrice(data.kpis.grossRevenueKrw) : '-'} />
        <Kpi label="Delivered revenue" value={data ? formatPrice(data.kpis.deliveredRevenueKrw) : '-'} />
        <Kpi label="Pending amount" value={data ? formatPrice(data.kpis.pendingOrderAmountKrw) : '-'} />
        <Kpi label="Average order" value={data ? formatPrice(data.kpis.averageOrderValueKrw) : '-'} hint={data ? `${data.kpis.totalOrders} orders` : undefined} />
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Title order={4}>Daily Revenue</Title>
        <Table striped highlightOnHover mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Orders</Table.Th>
              <Table.Th>Cancelled</Table.Th>
              <Table.Th ta="right">Revenue</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(data?.series ?? []).map((row) => (
              <Table.Tr key={row.date}>
                <Table.Td>{dayjs(row.date).format('DD.MM.YYYY')}</Table.Td>
                <Table.Td>{row.ordersCount}</Table.Td>
                <Table.Td>{row.cancelledCount}</Table.Td>
                <Table.Td ta="right">{formatPrice(row.revenueKrw)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Paper withBorder radius="md" p="md">
          <Title order={4}>By Status</Title>
          <Table striped mt="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Status</Table.Th>
                <Table.Th>Orders</Table.Th>
                <Table.Th ta="right">Amount</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data?.byStatus ?? []).map((row) => (
                <Table.Tr key={row.status}>
                  <Table.Td>{row.status}</Table.Td>
                  <Table.Td>{row.count}</Table.Td>
                  <Table.Td ta="right">{formatPrice(row.amountKrw)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Title order={4}>Top Products</Title>
          <Table striped mt="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Product</Table.Th>
                <Table.Th>Qty</Table.Th>
                <Table.Th ta="right">Revenue</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data?.topProducts ?? []).map((row) => (
                <Table.Tr key={row.productId}>
                  <Table.Td>{row.title}</Table.Td>
                  <Table.Td>{row.quantity}</Table.Td>
                  <Table.Td ta="right">{formatPrice(row.revenueKrw)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Title order={4}>Top Categories</Title>
        <Table striped mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Category</Table.Th>
              <Table.Th>Qty</Table.Th>
              <Table.Th ta="right">Revenue</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(data?.topCategories ?? []).map((row) => (
              <Table.Tr key={row.categoryId}>
                <Table.Td>{row.name}</Table.Td>
                <Table.Td>{row.quantity}</Table.Td>
                <Table.Td ta="right">{formatPrice(row.revenueKrw)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
}
