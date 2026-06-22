import {
  Alert,
  Card,
  Grid,
  Group,
  Loader,
  Progress,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { AreaChart, BarChart, DonutChart } from '@mantine/charts';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type UserTier,
  useGetDashboardOverviewQuery,
  useGetDashboardStatsQuery,
} from '../app/parfumApi';
import { formatPrice } from '../shared/lib/money';

const TIER_ORDER: UserTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
const TIER_COLORS: Record<UserTier, string> = {
  BRONZE: 'orange.6',
  SILVER: 'gray.6',
  GOLD: 'yellow.5',
  PLATINUM: 'cyan.5',
};

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
    <Card withBorder padding="md" radius="md" h="100%">
      <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
        {label}
      </Text>
      <Title order={4} mt={4}>
        {value}
      </Title>
      {hint ? (
        <Text size="xs" c="dimmed" mt={2}>
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState<[Date | null, Date | null]>([
    dayjs().subtract(13, 'day').toDate(),
    dayjs().toDate(),
  ]);

  const from = range[0] ? dayjs(range[0]).format('YYYY-MM-DD') : '';
  const to = range[1] ? dayjs(range[1]).format('YYYY-MM-DD') : '';

  const { data, isLoading, isFetching, error } = useGetDashboardStatsQuery(
    { from, to },
    { skip: !from || !to },
  );
  const { data: overview, isLoading: ovLoading } = useGetDashboardOverviewQuery();

  const chartData = useMemo(() => {
    if (!data?.series) return [];
    return data.series.map((row) => ({
      ...row,
      label: dayjs(row.date).format('MMM D'),
    }));
  }, [data?.series]);

  const financeChartData = useMemo(() => {
    if (!data?.series) return [];
    return data.series.map((row) => ({
      label: dayjs(row.date).format('MMM D'),
      cashNonCancelledUzs: row.cashNonCancelledUzs ?? 0,
      coinsAppliedNonCancelledUzs: row.coinsAppliedNonCancelledUzs ?? 0,
    }));
  }, [data?.series]);

  const tierData = useMemo(() => {
    if (!overview) return [];
    return TIER_ORDER.map((tier) => ({
      name: t(`userTier.${tier}` as const, tier),
      value: overview.users.tierDistribution[tier],
      color: TIER_COLORS[tier],
    })).filter((row) => row.value > 0);
  }, [overview, t]);

  const orderStatusData = useMemo(() => {
    if (!overview) return [];
    return [
      { name: t('dashboard.kpiPending'), value: overview.orders.pendingCount, color: 'gray.5' },
      { name: t('dashboard.kpiConfirmed'), value: overview.orders.confirmedCount, color: 'blue.5' },
      { name: t('dashboard.kpiShipped'), value: overview.orders.shippedCount, color: 'cyan.5' },
      { name: t('dashboard.kpiDelivered'), value: overview.orders.deliveredCount, color: 'teal.6' },
      { name: t('dashboard.kpiCancelled'), value: overview.orders.cancelledCount, color: 'red.5' },
    ].filter((row) => row.value > 0);
  }, [overview, t]);

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <div>
          <Title order={2}>{t('dashboard.title')}</Title>
          <Text size="sm" c="dimmed">
            {t('dashboard.subtitle')}
          </Text>
        </div>
        <DatePickerInput
          type="range"
          label={t('dashboard.dateRange')}
          placeholder={t('dashboard.pickDates')}
          value={range}
          onChange={setRange}
          maxDate={new Date()}
          w={{ base: '100%', sm: 320 }}
        />
      </Group>

      {error ? (
        <Alert color="red" title={t('dashboard.statsLoadErrorTitle')}>
          {t('dashboard.statsLoadErrorBody')}
        </Alert>
      ) : null}

      <Title order={4} mt="sm">
        {t('dashboard.sectionUsers')}
      </Title>
      <Grid>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('dashboard.kpiUsersTotal')}
            value={ovLoading ? '…' : overview?.users.total ?? '—'}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('dashboard.kpiUsersActive')}
            value={ovLoading ? '…' : overview?.users.activeLast7d ?? '—'}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('dashboard.kpiCoinBalance')}
            value={overview ? formatPrice(overview.users.coinBalanceTotal) : '…'}
            hint={overview ? `${t('dashboard.kpiAvgCoinBalance')}: ${formatPrice(overview.users.avgCoinBalance)}` : undefined}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('dashboard.kpiProfileFull')}
            value={
              overview
                ? `${Math.round(overview.users.profileCompletionRate * 100)}%`
                : '…'
            }
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder padding="md" radius="md">
            <Text size="sm" fw={600} mb="sm">
              {t('dashboard.tierDistribution')}
            </Text>
            {ovLoading ? <Loader size="sm" /> : null}
            {tierData.length > 0 ? (
              <Group align="flex-start" wrap="nowrap">
                <DonutChart
                  data={tierData}
                  size={140}
                  thickness={28}
                  withLabels
                  withTooltip
                />
                <Stack gap={4} flex={1}>
                  {TIER_ORDER.map((tier) => {
                    const v = overview?.users.tierDistribution[tier] ?? 0;
                    const total = overview?.users.total ?? 0;
                    const pct = total > 0 ? (v / total) * 100 : 0;
                    return (
                      <Stack key={tier} gap={2}>
                        <Group justify="space-between">
                          <Text size="sm">{t(`userTier.${tier}` as const)}</Text>
                          <Text size="sm" c="dimmed">
                            {v} · {pct.toFixed(1)}%
                          </Text>
                        </Group>
                        <Progress value={pct} size="sm" color={TIER_COLORS[tier].split('.')[0]} />
                      </Stack>
                    );
                  })}
                </Stack>
              </Group>
            ) : null}
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder padding="md" radius="md">
            <Text size="sm" fw={600} mb="sm">
              {t('dashboard.ordersByStatus')}
            </Text>
            {orderStatusData.length > 0 ? (
              <BarChart
                h={200}
                data={orderStatusData.map((d) => ({ name: d.name, value: d.value }))}
                dataKey="name"
                series={[{ name: 'value', color: 'parfum.6' }]}
                tickLine="y"
                gridAxis="y"
              />
            ) : null}
          </Card>
        </Grid.Col>
      </Grid>

      <Title order={4} mt="sm">
        {t('dashboard.sectionOrders')}
      </Title>
      <Grid>
        <Grid.Col span={{ base: 6, sm: 4, md: 2 }}>
          <StatCard label={t('dashboard.kpiOrdersTotal')} value={overview?.orders.total ?? '—'} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 2 }}>
          <StatCard label={t('dashboard.kpiPending')} value={overview?.orders.pendingCount ?? '—'} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 2 }}>
          <StatCard label={t('dashboard.kpiConfirmed')} value={overview?.orders.confirmedCount ?? '—'} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 2 }}>
          <StatCard label={t('dashboard.kpiShipped')} value={overview?.orders.shippedCount ?? '—'} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 2 }}>
          <StatCard label={t('dashboard.kpiDelivered')} value={overview?.orders.deliveredCount ?? '—'} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 2 }}>
          <StatCard label={t('dashboard.kpiCancelled')} value={overview?.orders.cancelledCount ?? '—'} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <StatCard label={t('dashboard.ordersInRange')} value={data?.totals.ordersInRange ?? '—'} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <StatCard label={t('dashboard.newUsersInRange')} value={data?.totals.newUsersInRange ?? '—'} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <StatCard
            label={t('dashboard.cashNonCancelled')}
            value={data?.totals.cashNonCancelledUzs != null ? formatPrice(data.totals.cashNonCancelledUzs) : '—'}
            hint={
              data?.totals.coinsAppliedNonCancelledUzs != null
                ? `${t('dashboard.coinsApplied')}: ${formatPrice(data.totals.coinsAppliedNonCancelledUzs)}`
                : undefined
            }
          />
        </Grid.Col>
      </Grid>

      <Title order={4} mt="sm">
        {t('dashboard.sectionCatalog')}
      </Title>
      <Grid>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard label={t('dashboard.productCount')} value={overview?.catalog.productCount ?? '—'} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard label={t('dashboard.kpiBestseller')} value={overview?.catalog.bestsellerCount ?? '—'} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard label={t('dashboard.kpiNewArrival')} value={overview?.catalog.newArrivalCount ?? '—'} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard label={t('dashboard.kpiDiscounted')} value={overview?.catalog.discountedCount ?? '—'} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('dashboard.kpiAvgPrice')}
            value={overview ? formatPrice(overview.catalog.averagePriceUzs) : '—'}
          />
        </Grid.Col>
      </Grid>

      <Title order={4} mt="sm">
        {t('dashboard.sectionInventory')}
      </Title>
      <Grid>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('dashboard.kpiInventoryGrams')}
            value={overview ? `${overview.inventory.totalStockGrams.toLocaleString('ru-RU')} g` : '—'}
            hint={overview ? `${overview.inventory.productsTrackedGrams} SKU` : undefined}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('dashboard.kpiInventoryPieces')}
            value={overview?.inventory.totalStockPieces ?? '—'}
            hint={overview ? `${overview.inventory.productsTrackedPieces} SKU` : undefined}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('dashboard.kpiLowStock')}
            value={overview?.inventory.lowStockCount ?? '—'}
          />
        </Grid.Col>
      </Grid>

      <Title order={4} mt="sm">
        {t('dashboard.sectionEngagement')}
      </Title>
      <Grid>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard label={t('dashboard.kpiWishlist')} value={overview?.engagement.wishlistCount ?? '—'} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard label={t('dashboard.kpiCart')} value={overview?.engagement.cartItemCount ?? '—'} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('dashboard.kpiReferralRewards')}
            value={overview?.engagement.referralRewardsCount ?? '—'}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('dashboard.kpiPendingFeedback')}
            value={overview?.engagement.productFeedbackPending ?? '—'}
          />
        </Grid.Col>
      </Grid>

      <Card withBorder padding="lg" radius="md">
        <Text size="sm" fw={600} mb="md">
          {t('dashboard.activity')}
          {isFetching && !isLoading ? (
            <Text span size="xs" c="dimmed" ml="xs">
              {t('dashboard.updating')}
            </Text>
          ) : null}
        </Text>
        {chartData.length === 0 && isLoading ? (
          <Loader />
        ) : (
          <AreaChart
            h={280}
            data={chartData}
            dataKey="label"
            series={[
              { name: 'orders', label: t('dashboard.chartOrders'), color: 'parfum.6' },
              { name: 'newUsers', label: t('dashboard.chartNewUsers'), color: 'teal.7' },
            ]}
            curveType="monotone"
            withLegend
            withDots={false}
          />
        )}
      </Card>

      <Card withBorder padding="lg" radius="md">
        <Text size="sm" fw={600} mb="md">
          {t('dashboard.financeActivity')}
        </Text>
        {financeChartData.length === 0 && isLoading ? (
          <Loader />
        ) : (
          <AreaChart
            h={260}
            data={financeChartData}
            dataKey="label"
            series={[
              { name: 'cashNonCancelledUzs', label: t('dashboard.chartCash'), color: 'parfum.6' },
              { name: 'coinsAppliedNonCancelledUzs', label: t('dashboard.chartCoins'), color: 'violet.6' },
            ]}
            curveType="monotone"
            withLegend
            withDots={false}
          />
        )}
      </Card>
    </Stack>
  );
}
