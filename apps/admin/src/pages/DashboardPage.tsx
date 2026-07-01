import { Badge, Group, Paper, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import dayjs from 'dayjs';
import { useGetDashboardOverviewQuery, useGetDashboardStatsQuery } from '../app/parfumApi';
import { formatPrice } from '../shared/lib/money';
import { ORDER_STATUS_LABEL } from '../shared/lib/orderStatusMantine';

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
          <Title order={2}>Asosiy panel</Title>
          <Text c="dimmed" size="sm">
            Buyurtmalar, mahsulotlar, ombor va foydalanuvchilar bo‘yicha Ansor Market ko‘rsatkichlari.
          </Text>
        </Stack>
        <Badge variant="light" color="parfum">
          KRW
        </Badge>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <StatCard
          label="Daromad"
          value={overview ? formatPrice(overview.finance.revenueKrw) : overviewLoading ? '...' : '-'}
          hint={overview ? `Yetkazilgan: ${formatPrice(overview.finance.deliveredRevenueKrw)}` : undefined}
        />
        <StatCard
          label="Buyurtmalar"
          value={overview?.orders.total ?? (overviewLoading ? '...' : '-')}
          hint={overview ? `Bugun: ${overview.orders.todayOrders}` : undefined}
        />
        <StatCard
          label="Mahsulotlar"
          value={overview?.catalog.productCount ?? (overviewLoading ? '...' : '-')}
          hint={overview ? `Chegirma ${overview.catalog.saleCount} · Ko‘p sotilgan ${overview.catalog.bestsellerCount}` : undefined}
        />
        <StatCard
          label="Ombor"
          value={overview?.inventory.totalStockQuantity ?? (overviewLoading ? '...' : '-')}
          hint={overview ? `Kam qoldiq: ${overview.inventory.lowStockCount}` : undefined}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Paper withBorder radius="md" p="md">
          <Title order={4}>Buyurtma holatlari</Title>
          <Table mt="sm" striped>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>{ORDER_STATUS_LABEL.PENDING}</Table.Td>
                <Table.Td ta="right">{overview?.orders.pendingCount ?? '-'}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>{ORDER_STATUS_LABEL.CONFIRMED}</Table.Td>
                <Table.Td ta="right">{overview?.orders.confirmedCount ?? '-'}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>{ORDER_STATUS_LABEL.PREPARING}</Table.Td>
                <Table.Td ta="right">{overview?.orders.preparingCount ?? '-'}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>{ORDER_STATUS_LABEL.SHIPPED}</Table.Td>
                <Table.Td ta="right">{overview?.orders.shippedCount ?? '-'}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>{ORDER_STATUS_LABEL.DELIVERED}</Table.Td>
                <Table.Td ta="right">{overview?.orders.deliveredCount ?? '-'}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>{ORDER_STATUS_LABEL.CANCELLED}</Table.Td>
                <Table.Td ta="right">{overview?.orders.cancelledCount ?? '-'}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Title order={4}>Faollik</Title>
          <SimpleGrid cols={2} mt="sm">
            <StatCard label="Foydalanuvchilar" value={overview?.users.total ?? '-'} hint={overview ? `7 kun: ${overview.users.newLast7d}` : undefined} />
            <StatCard label="Istaklar" value={overview?.engagement.wishlistCount ?? '-'} />
            <StatCard label="Savatdagi mahsulotlar" value={overview?.engagement.cartItemCount ?? '-'} />
            <StatCard label="Tekshiruvdagi sharhlar" value={overview?.engagement.productFeedbackPending ?? '-'} />
          </SimpleGrid>
        </Paper>
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Group justify="space-between">
          <Title order={4}>Oxirgi 14 kun</Title>
          {statsLoading ? <Text size="sm" c="dimmed">Yuklanmoqda...</Text> : null}
        </Group>
        <Table mt="sm" striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Sana</Table.Th>
              <Table.Th>Buyurtmalar</Table.Th>
              <Table.Th>Yangi foydalanuvchilar</Table.Th>
              <Table.Th>Bekor qilingan</Table.Th>
              <Table.Th ta="right">Daromad</Table.Th>
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
