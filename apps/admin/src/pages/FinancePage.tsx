import type { ReactNode } from 'react';
import {
  Alert,
  Anchor,
  Button,
  Card,
  Group,
  Loader,
  Menu,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconDownload } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  type FinanceKpis,
  type OrderStatus,
  useGetFinanceReportQuery,
} from '../app/parfumApi';
import { useAppSelector } from '../app/hooks';
import { downloadFinanceCsv } from '../shared/lib/downloadFinanceCsv';
import { formatPrice } from '../shared/lib/money';
import { ORDER_STATUS_MANTINE_COLOR } from '../shared/lib/orderStatusMantine';

function pctDelta(current: number, previous: number | undefined): number | null {
  if (previous == null) return null;
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function DeltaText({ delta }: { delta: number | null }) {
  if (delta == null) return null;
  const sign = delta >= 0 ? '+' : '';
  const color = delta >= 0 ? 'teal' : 'red';
  return (
    <Text size="xs" c={color} fw={600}>
      {sign}
      {delta.toFixed(1)}%
    </Text>
  );
}

function KpiCard({
  label,
  hint,
  value,
  delta,
  compareLabel,
}: {
  label: string;
  hint: string;
  value: string;
  delta: number | null;
  compareLabel: string;
}) {
  return (
    <Card withBorder padding="md" radius="md" h="100%">
      <Tooltip label={hint} multiline w={280}>
        <Text size="xs" tt="uppercase" c="dimmed" fw={600} style={{ cursor: 'help' }}>
          {label}
        </Text>
      </Tooltip>
      <Title order={4} mt={4}>
        {value}
      </Title>
      {delta != null ? (
        <Group gap={4} mt={4}>
          <DeltaText delta={delta} />
          <Text size="xs" c="dimmed">
            {compareLabel}
          </Text>
        </Group>
      ) : null}
    </Card>
  );
}

function CoinMetric({
  label,
  hint,
  value,
  sub,
}: {
  label: string;
  hint: string;
  value: string;
  sub?: ReactNode;
}) {
  return (
    <div>
      <Tooltip label={hint} multiline w={280}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ cursor: 'help' }}>
          {label}
        </Text>
      </Tooltip>
      <Title order={4} mt={4}>
        {value}
      </Title>
      {sub}
    </div>
  );
}

const DAYJS_LOCALE = 'uz-latn';

export function FinancePage() {
  const { t } = useTranslation();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const [range, setRange] = useState<[Date | null, Date | null]>([
    dayjs().subtract(13, 'day').toDate(),
    dayjs().toDate(),
  ]);
  const [compare, setCompare] = useState(true);
  const [exporting, setExporting] = useState(false);

  const from = range[0] ? dayjs(range[0]).format('YYYY-MM-DD') : '';
  const to = range[1] ? dayjs(range[1]).format('YYYY-MM-DD') : '';

  const { data, isLoading, isFetching, error } = useGetFinanceReportQuery(
    { from, to, compare },
    { skip: !from || !to },
  );

  const chartData = useMemo(() => {
    if (!data?.series) return [];
    const locale = DAYJS_LOCALE;
    return data.series.map((row) => ({
      ...row,
      label: dayjs(row.date).locale(locale).format('D MMM'),
    }));
  }, [data?.series]);

  const grossTotalForShare = useMemo(() => {
    if (!data?.byStatus) return 0;
    return data.byStatus.reduce((s, r) => s + r.grossUzs, 0);
  }, [data?.byStatus]);

  const tierGrossTotal = useMemo(() => {
    if (!data?.byTier) return 0;
    return data.byTier.reduce((s, r) => s + r.grossUzs, 0);
  }, [data?.byTier]);

  const kpiDeltas = useMemo(() => {
    if (!data?.kpisPrev) return null;
    const prev = data.kpisPrev;
    const cur = data.kpis;
    const map = (getter: (k: FinanceKpis) => number) => pctDelta(getter(cur), getter(prev));
    return {
      grossRevenueUzs: map((k) => k.grossRevenueUzs),
      cashCollectedUzs: map((k) => k.cashCollectedUzs),
      coinsAppliedUzs: map((k) => k.coinsAppliedUzs),
      promoDiscountUzs: map((k) => k.promoDiscountUzs),
      ordersCount: map((k) => k.ordersCount),
      aovUzs: map((k) => k.aovUzs),
      cancelledCashUzs: map((k) => k.cancelledCashUzs),
    };
  }, [data]);

  const handleExport = async (kind: 'series' | 'orders') => {
    if (!from || !to) return;
    setExporting(true);
    try {
      await downloadFinanceCsv(kind, from, to, accessToken);
      notifications.show({ color: 'green', title: t('finance.exportSuccess'), message: '' });
    } catch {
      notifications.show({ color: 'red', title: t('finance.exportError'), message: '' });
    } finally {
      setExporting(false);
    }
  };

  const compareLabel = t('finance.deltaVsPrev');

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <div>
          <Title order={2}>{t('finance.title')}</Title>
          <Text size="sm" c="dimmed">
            {t('finance.subtitle')}
          </Text>
        </div>
        <Group align="flex-end" wrap="wrap">
          <Switch
            label={t('finance.comparePeriod')}
            checked={compare}
            onChange={(e) => setCompare(e.currentTarget.checked)}
          />
          <DatePickerInput
            type="range"
            label={t('finance.dateRange')}
            value={range}
            onChange={setRange}
            maxDate={new Date()}
            w={{ base: '100%', sm: 320 }}
          />
          <Menu position="bottom-end">
            <Menu.Target>
              <Button
                variant="light"
                leftSection={<IconDownload size={16} />}
                loading={exporting}
                disabled={!from || !to}
              >
                {t('finance.exportCsv')}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => handleExport('series')}>
                {t('finance.exportSeries')}
              </Menu.Item>
              <Menu.Item onClick={() => handleExport('orders')}>
                {t('finance.exportOrders')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {error ? (
        <Alert color="red" title={t('finance.loadErrorTitle')}>
          {t('finance.loadErrorBody')}
        </Alert>
      ) : null}

      {isLoading ? (
        <Loader />
      ) : data ? (
        <Stack gap="xl">
          {isFetching && !isLoading ? (
            <Text size="xs" c="dimmed">
              {t('finance.updating')}
            </Text>
          ) : null}

          <SimpleGrid cols={{ base: 2, md: 4 }}>
            <KpiCard
              label={t('finance.kpiGrossRevenue')}
              hint={t('finance.kpiGrossRevenueHint')}
              value={formatPrice(data.kpis.grossRevenueUzs)}
              delta={compare ? kpiDeltas?.grossRevenueUzs ?? null : null}
              compareLabel={compareLabel}
            />
            <KpiCard
              label={t('finance.kpiCashCollected')}
              hint={t('finance.kpiCashCollectedHint')}
              value={formatPrice(data.kpis.cashCollectedUzs)}
              delta={compare ? kpiDeltas?.cashCollectedUzs ?? null : null}
              compareLabel={compareLabel}
            />
            <KpiCard
              label={t('finance.kpiCoinsApplied')}
              hint={t('finance.kpiCoinsAppliedHint')}
              value={formatPrice(data.kpis.coinsAppliedUzs)}
              delta={compare ? kpiDeltas?.coinsAppliedUzs ?? null : null}
              compareLabel={compareLabel}
            />
            <KpiCard
              label={t('finance.kpiPromoDiscount')}
              hint={t('finance.kpiPromoDiscountHint')}
              value={formatPrice(data.kpis.promoDiscountUzs)}
              delta={compare ? kpiDeltas?.promoDiscountUzs ?? null : null}
              compareLabel={compareLabel}
            />
            <KpiCard
              label={t('finance.kpiOrders')}
              hint={t('finance.kpiOrdersHint')}
              value={String(data.kpis.ordersCount)}
              delta={compare ? kpiDeltas?.ordersCount ?? null : null}
              compareLabel={compareLabel}
            />
            <KpiCard
              label={t('finance.kpiAov')}
              hint={t('finance.kpiAovHint')}
              value={formatPrice(data.kpis.aovUzs)}
              delta={compare ? kpiDeltas?.aovUzs ?? null : null}
              compareLabel={compareLabel}
            />
            <KpiCard
              label={t('finance.kpiCancelledCash')}
              hint={t('finance.kpiCancelledCashHint')}
              value={formatPrice(data.kpis.cancelledCashUzs)}
              delta={compare ? kpiDeltas?.cancelledCashUzs ?? null : null}
              compareLabel={compareLabel}
            />
            <KpiCard
              label={t('finance.kpiOutstandingLiability')}
              hint={t('finance.kpiOutstandingLiabilityHint')}
              value={formatPrice(data.coinEconomy.outstandingLiabilityNow)}
              delta={null}
              compareLabel={compareLabel}
            />
          </SimpleGrid>

          <Card withBorder padding="lg" radius="md">
            <Text size="sm" fw={600}>
              {t('finance.sectionChart')}
            </Text>
            <Text size="xs" c="dimmed" mb="md">
              {t('finance.sectionChartHint')}
            </Text>
            {chartData.length > 0 ? (
              <AreaChart
                h={280}
                data={chartData}
                dataKey="label"
                type="stacked"
                series={[
                  { name: 'cashUzs', label: t('finance.chartCash'), color: 'parfum.6' },
                  { name: 'coinsUzs', label: t('finance.chartCoins'), color: 'violet.6' },
                  { name: 'discountUzs', label: t('finance.chartDiscount'), color: 'orange.5' },
                ]}
                curveType="monotone"
                withLegend
                withDots={false}
                valueFormatter={(v) => formatPrice(v)}
              />
            ) : (
              <Text size="sm" c="dimmed">
                {t('finance.chartEmpty')}
              </Text>
            )}
          </Card>

          <Card withBorder padding="lg" radius="md">
            <Text size="sm" fw={600}>
              {t('finance.sectionByStatus')}
            </Text>
            <Text size="xs" c="dimmed" mb="md">
              {t('finance.sectionByStatusHint')}
            </Text>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('finance.colStatus')}</Table.Th>
                  <Table.Th>{t('finance.colCount')}</Table.Th>
                  <Table.Th>{t('finance.colGross')}</Table.Th>
                  <Table.Th>{t('finance.colCash')}</Table.Th>
                  <Table.Th>{t('finance.colCoins')}</Table.Th>
                  <Table.Th>{t('finance.colShare')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.byStatus.map((row) => {
                  const share =
                    grossTotalForShare > 0
                      ? ((row.grossUzs / grossTotalForShare) * 100).toFixed(1)
                      : '0.0';
                  const isCancelled = row.status === 'CANCELLED';
                  return (
                    <Table.Tr
                      key={row.status}
                      bg={isCancelled ? 'var(--mantine-color-red-0)' : undefined}
                    >
                      <Table.Td>
                        <Text
                          size="sm"
                          fw={500}
                          c={ORDER_STATUS_MANTINE_COLOR[row.status as OrderStatus]}
                        >
                          {t(`orderStatus.${row.status}` as const)}
                        </Text>
                      </Table.Td>
                      <Table.Td>{row.count}</Table.Td>
                      <Table.Td>{formatPrice(row.grossUzs)}</Table.Td>
                      <Table.Td>{formatPrice(row.cashUzs)}</Table.Td>
                      <Table.Td>{formatPrice(row.coinsUzs)}</Table.Td>
                      <Table.Td>{share}%</Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Card>

          <Card withBorder padding="lg" radius="md">
            <Text size="sm" fw={600}>
              {t('finance.sectionCoinEconomy')}
            </Text>
            <Text size="xs" c="dimmed" mb="md">
              {t('finance.sectionCoinEconomyHint')}
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              <CoinMetric
                label={t('finance.coinIssued')}
                hint={t('finance.coinIssuedHint')}
                value={formatPrice(data.coinEconomy.issuedInRange.total)}
                sub={
                  <Stack gap={2} mt="xs">
                    <Text size="xs" c="dimmed">
                      {t('finance.coinKindReferral')}:{' '}
                      {formatPrice(data.coinEconomy.issuedInRange.byKind.REFERRAL_EARNED)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t('finance.coinKindProfile')}:{' '}
                      {formatPrice(data.coinEconomy.issuedInRange.byKind.PROFILE_BONUS)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t('finance.coinKindAdminGift')}:{' '}
                      {formatPrice(data.coinEconomy.issuedInRange.byKind.ADMIN_GIFT)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t('finance.coinKindAdminAdjust')}:{' '}
                      {formatPrice(
                        data.coinEconomy.issuedInRange.byKind.ADMIN_ADJUSTMENT_POSITIVE,
                      )}
                    </Text>
                  </Stack>
                }
              />
              <CoinMetric
                label={t('finance.coinRedeemed')}
                hint={t('finance.coinRedeemedHint')}
                value={formatPrice(data.coinEconomy.redeemedInRange)}
              />
              <CoinMetric
                label={t('finance.coinRefunded')}
                hint={t('finance.coinRefundedHint')}
                value={formatPrice(data.coinEconomy.refundedInRange)}
              />
              <CoinMetric
                label={t('finance.coinAdminNegative')}
                hint={t('finance.coinAdminNegativeHint')}
                value={formatPrice(data.coinEconomy.adminAdjustmentsNegativeInRange)}
              />
              <CoinMetric
                label={t('finance.coinNetChange')}
                hint={t('finance.coinNetChangeHint')}
                value={formatPrice(data.coinEconomy.netChangeInRange)}
              />
              <CoinMetric
                label={t('finance.coinOutstanding')}
                hint={t('finance.kpiOutstandingLiabilityHint')}
                value={formatPrice(data.coinEconomy.outstandingLiabilityNow)}
              />
            </SimpleGrid>
          </Card>

          <Card withBorder padding="lg" radius="md">
            <Text size="sm" fw={600}>
              {t('finance.sectionByTier')}
            </Text>
            <Text size="xs" c="dimmed" mb="md">
              {t('finance.sectionByTierHint')}
            </Text>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('finance.colTier')}</Table.Th>
                  <Table.Th>{t('finance.colOrders')}</Table.Th>
                  <Table.Th>{t('finance.colGross')}</Table.Th>
                  <Table.Th>{t('finance.colCash')}</Table.Th>
                  <Table.Th>{t('finance.colCoins')}</Table.Th>
                  <Table.Th>{t('finance.colShare')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.byTier.map((row) => {
                  const share =
                    tierGrossTotal > 0
                      ? ((row.grossUzs / tierGrossTotal) * 100).toFixed(1)
                      : '0.0';
                  return (
                    <Table.Tr key={row.tier}>
                      <Table.Td>{t(`userTier.${row.tier}` as const)}</Table.Td>
                      <Table.Td>{row.count}</Table.Td>
                      <Table.Td>{formatPrice(row.grossUzs)}</Table.Td>
                      <Table.Td>{formatPrice(row.cashUzs)}</Table.Td>
                      <Table.Td>{formatPrice(row.coinsUzs)}</Table.Td>
                      <Table.Td>{share}%</Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Card>

          <Card withBorder padding="lg" radius="md">
            <Text size="sm" fw={600}>
              {t('finance.sectionTopCustomers')}
            </Text>
            <Text size="xs" c="dimmed" mb="md">
              {t('finance.sectionTopCustomersHint')}
            </Text>
            {data.topCustomers.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t('finance.emptyCustomers')}
              </Text>
            ) : (
              <Table striped withTableBorder highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('finance.colCustomer')}</Table.Th>
                    <Table.Th>{t('finance.colTelegram')}</Table.Th>
                    <Table.Th>{t('finance.colOrders')}</Table.Th>
                    <Table.Th>{t('finance.colGross')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.topCustomers.map((row) => (
                    <Table.Tr key={row.userId}>
                      <Table.Td>
                        <Anchor component={Link} to={`/users/${row.userId}`} size="sm">
                          {row.displayName}
                        </Anchor>
                      </Table.Td>
                      <Table.Td>
                        <Text ff="monospace" size="sm">
                          {row.telegramId}
                        </Text>
                      </Table.Td>
                      <Table.Td>{row.ordersCount}</Table.Td>
                      <Table.Td>{formatPrice(row.grossUzs)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>

          <Card withBorder padding="lg" radius="md">
            <Text size="sm" fw={600}>
              {t('finance.sectionPromoCodes')}
            </Text>
            <Text size="xs" c="dimmed" mb="md">
              {t('finance.sectionPromoCodesHint')}
            </Text>
            {data.promoCodes.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t('finance.emptyPromo')}
              </Text>
            ) : (
              <Table striped withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('finance.colCode')}</Table.Th>
                    <Table.Th>{t('finance.colRedemptions')}</Table.Th>
                    <Table.Th>{t('finance.colDiscount')}</Table.Th>
                    <Table.Th>{t('finance.colOrders')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.promoCodes.map((row) => (
                    <Table.Tr key={row.promoCodeId}>
                      <Table.Td>
                        <Text ff="monospace" fw={600}>
                          {row.code}
                        </Text>
                      </Table.Td>
                      <Table.Td>{row.redemptions}</Table.Td>
                      <Table.Td>{formatPrice(row.discountUzs)}</Table.Td>
                      <Table.Td>{row.ordersCount}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Stack>
      ) : null}
    </Stack>
  );
}
