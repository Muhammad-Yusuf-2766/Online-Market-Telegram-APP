import { Badge, Group, Paper, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import dayjs from 'dayjs';
import { useGetDashboardOverviewQuery, useGetDashboardStatsQuery } from '../app/parfumApi';
import { formatPrice } from '../shared/lib/money';

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Paper withBorder radius="md" p="md">
      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
        {label}
      </Text>
      <Text fw={700} size="xl" mt={4}>
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

export function DashboardPage() {
  const to = dayjs().format('YYYY-MM-DD');
  const from = dayjs().subtract(13, 'day').format('YYYY-MM-DD');
  const { data: overview, isLoading: overviewLoading } = useGetDashboardOverviewQuery();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery({ from, to });

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={2}>Dashboard</Title>
          <Text c="dimmed" size="sm">
            Ansor Market overview for orders, products, inventory, and customers.
          </Text>
        </Stack>
        <Badge variant="light" color="parfum">
          KRW
        </Badge>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <StatCard
          label="Revenue"
          value={overview ? formatPrice(overview.finance.revenueKrw) : overviewLoading ? '...' : '-'}
          hint={overview ? `Delivered: ${formatPrice(overview.finance.deliveredRevenueKrw)}` : undefined}
        />
        <StatCard
          label="Orders"
          value={overview?.orders.total ?? (overviewLoading ? '...' : '-')}
          hint={overview ? `Today: ${overview.orders.todayOrders}` : undefined}
        />
        <StatCard
          label="Products"
          value={overview?.catalog.productCount ?? (overviewLoading ? '...' : '-')}
          hint={overview ? `Sale ${overview.catalog.saleCount} · Bestseller ${overview.catalog.bestsellerCount}` : undefined}
        />
        <StatCard
          label="Inventory"
          value={overview?.inventory.totalStockQuantity ?? (overviewLoading ? '...' : '-')}
          hint={overview ? `Low stock: ${overview.inventory.lowStockCount}` : undefined}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Paper withBorder radius="md" p="md">
          <Title order={4}>Order Status</Title>
          <Table mt="sm" striped>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>Pending</Table.Td>
                <Table.Td ta="right">{overview?.orders.pendingCount ?? '-'}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Confirmed</Table.Td>
                <Table.Td ta="right">{overview?.orders.confirmedCount ?? '-'}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Preparing</Table.Td>
                <Table.Td ta="right">{overview?.orders.preparingCount ?? '-'}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Shipped</Table.Td>
                <Table.Td ta="right">{overview?.orders.shippedCount ?? '-'}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Delivered</Table.Td>
                <Table.Td ta="right">{overview?.orders.deliveredCount ?? '-'}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Cancelled</Table.Td>
                <Table.Td ta="right">{overview?.orders.cancelledCount ?? '-'}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Title order={4}>Engagement</Title>
          <SimpleGrid cols={2} mt="sm">
            <StatCard label="Users" value={overview?.users.total ?? '-'} hint={overview ? `7 days: ${overview.users.newLast7d}` : undefined} />
            <StatCard label="Wishlist" value={overview?.engagement.wishlistCount ?? '-'} />
            <StatCard label="Cart items" value={overview?.engagement.cartItemCount ?? '-'} />
            <StatCard label="Reviews pending" value={overview?.engagement.productFeedbackPending ?? '-'} />
          </SimpleGrid>
        </Paper>
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Group justify="space-between">
          <Title order={4}>Last 14 Days</Title>
          {statsLoading ? <Text size="sm" c="dimmed">Loading...</Text> : null}
        </Group>
        <Table mt="sm" striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Orders</Table.Th>
              <Table.Th>New users</Table.Th>
              <Table.Th>Cancelled</Table.Th>
              <Table.Th ta="right">Revenue</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(stats?.series ?? []).map((row) => (
              <Table.Tr key={row.date}>
                <Table.Td>{dayjs(row.date).format('DD.MM.YYYY')}</Table.Td>
                <Table.Td>{row.orders}</Table.Td>
                <Table.Td>{row.newUsers}</Table.Td>
                <Table.Td>{row.cancelledOrderCount}</Table.Td>
                <Table.Td ta="right">{formatPrice(row.revenueKrw)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
}
