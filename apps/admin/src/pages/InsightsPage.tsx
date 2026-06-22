import { Alert, Card, Group, Loader, SegmentedControl, Stack, Table, Text, Title } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { BarChart } from '@mantine/charts';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useGetInsightsAovLtvQuery,
  useGetInsightsFunnelQuery,
  useGetInsightsSearchTermsQuery,
  useGetInsightsTopProductsQuery,
} from '../app/parfumApi';
import { formatPrice } from '../shared/lib/money';

export function InsightsPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState<[Date | null, Date | null]>([
    dayjs().subtract(13, 'day').toDate(),
    dayjs().toDate(),
  ]);
  const [metric, setMetric] = useState<'views' | 'sales' | 'revenue'>('views');
  const from = range[0] ? dayjs(range[0]).format('YYYY-MM-DD') : '';
  const to = range[1] ? dayjs(range[1]).format('YYYY-MM-DD') : '';
  const skip = !from || !to;

  const funnel = useGetInsightsFunnelQuery({ from, to }, { skip });
  const aovLtv = useGetInsightsAovLtvQuery({ from, to }, { skip });
  const topProducts = useGetInsightsTopProductsQuery({ from, to, metric }, { skip });
  const searchTerms = useGetInsightsSearchTermsQuery({ from, to }, { skip });

  const topProductsChart = useMemo(
    () =>
      (topProducts.data ?? []).slice(0, 10).map((row) => ({
        name: row.title,
        value: row.value,
      })),
    [topProducts.data],
  );

  const loading =
    funnel.isLoading || aovLtv.isLoading || topProducts.isLoading || searchTerms.isLoading;
  const hasError = funnel.isError || aovLtv.isError || topProducts.isError || searchTerms.isError;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2}>{t('insights.title')}</Title>
          <Text size="sm" c="dimmed">
            {t('insights.subtitle')}
          </Text>
        </div>
        <DatePickerInput
          type="range"
          value={range}
          onChange={setRange}
          maxDate={new Date()}
          w={{ base: '100%', sm: 320 }}
        />
      </Group>

      {hasError ? (
        <Alert color="red" title={t('insights.loadError')}>
          {t('insights.loadErrorBody')}
        </Alert>
      ) : null}

      {loading ? <Loader /> : null}

      {aovLtv.data ? (
        <Group grow>
          <Card withBorder>
            <Text size="xs" c="dimmed" tt="uppercase">
              {t('insights.revenue')}
            </Text>
            <Title order={3}>{formatPrice(aovLtv.data.revenueUzs)}</Title>
          </Card>
          <Card withBorder>
            <Text size="xs" c="dimmed" tt="uppercase">
              {t('insights.aov')}
            </Text>
            <Title order={3}>{formatPrice(aovLtv.data.aovUzs)}</Title>
          </Card>
          <Card withBorder>
            <Text size="xs" c="dimmed" tt="uppercase">
              {t('insights.ltv')}
            </Text>
            <Title order={3}>{formatPrice(aovLtv.data.ltvUzs)}</Title>
          </Card>
          <Card withBorder>
            <Text size="xs" c="dimmed" tt="uppercase">
              {t('insights.repeatRate')}
            </Text>
            <Title order={3}>{(aovLtv.data.repeatPurchaseRate * 100).toFixed(1)}%</Title>
          </Card>
        </Group>
      ) : null}

      {funnel.data ? (
        <Card withBorder>
          <Title order={4} mb="sm">
            {t('insights.funnelTitle')}
          </Title>
          <Table withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('insights.funnelStep')}</Table.Th>
                <Table.Th>{t('insights.funnelValue')}</Table.Th>
                <Table.Th>{t('insights.funnelConversion')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {funnel.data.steps.map((step) => (
                <Table.Tr key={step.key}>
                  <Table.Td>{step.label}</Table.Td>
                  <Table.Td>{step.value}</Table.Td>
                  <Table.Td>
                    {step.conversionFromPrev == null
                      ? '—'
                      : `${(step.conversionFromPrev * 100).toFixed(1)}%`}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      ) : null}

      <Card withBorder>
        <Group justify="space-between" mb="sm">
          <Title order={4}>{t('insights.topProductsTitle')}</Title>
          <SegmentedControl
            value={metric}
            onChange={(value) => setMetric(value as 'views' | 'sales' | 'revenue')}
            data={[
              { label: t('insights.metricViews'), value: 'views' },
              { label: t('insights.metricSales'), value: 'sales' },
              { label: t('insights.metricRevenue'), value: 'revenue' },
            ]}
          />
        </Group>
        <BarChart h={260} data={topProductsChart} dataKey="name" series={[{ name: 'value', color: 'parfum.6' }]} />
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          {t('insights.topSearchTitle')}
        </Title>
        <Table striped withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('insights.colQuery')}</Table.Th>
              <Table.Th>{t('insights.colCount')}</Table.Th>
              <Table.Th>{t('insights.colZeroResults')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(searchTerms.data ?? []).slice(0, 20).map((row) => (
              <Table.Tr key={row.query}>
                <Table.Td>{row.query}</Table.Td>
                <Table.Td>{row.count}</Table.Td>
                <Table.Td>{row.zeroResultCount}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}
