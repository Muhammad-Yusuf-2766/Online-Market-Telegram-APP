import {
  Alert,
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Modal,
  NumberInput,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type Product,
  useAdjustInventoryGramsMutation,
  useGetInventoryLowStockQuery,
  useGetInventoryMovementsQuery,
  useGetInventorySummaryQuery,
} from '../app/parfumApi';

function formatGrams(grams: number | null | undefined): string {
  if (grams === null || grams === undefined) return '—';
  return `${grams.toLocaleString('ru-RU')} g`;
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
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

export function InventoryPage() {
  const { t } = useTranslation();
  const { data: summary } = useGetInventorySummaryQuery();
  const { data: lowStock, isLoading: lowLoading } = useGetInventoryLowStockQuery();
  const { data: movements, isLoading: movLoading } = useGetInventoryMovementsQuery({
    page: 1,
    pageSize: 50,
  });
  const [adjustGrams] = useAdjustInventoryGramsMutation();

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [delta, setDelta] = useState<number | string>('');
  const [reason, setReason] = useState<string>('RESTOCK');
  const [submitting, setSubmitting] = useState(false);

  async function applyAdjust() {
    if (!adjustProduct) return;
    const dn = typeof delta === 'number' ? delta : Number(delta);
    if (!Number.isFinite(dn) || dn === 0) return;
    setSubmitting(true);
    try {
      const r = await adjustGrams({
        productId: adjustProduct.id,
        deltaGrams: Math.trunc(dn),
        reason,
      }).unwrap();
      notifications.show({
        color: 'green',
        title: t('inventory.adjustGrams'),
        message: t('inventory.applied', { stockGrams: r.stockGrams }),
      });
      setAdjustOpen(false);
      setAdjustProduct(null);
      setDelta('');
      setReason('RESTOCK');
    } catch {
      notifications.show({ color: 'red', title: t('inventory.applyError'), message: '' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>{t('inventory.title')}</Title>
        <Text size="sm" c="dimmed">
          {t('inventory.subtitle')}
        </Text>
      </div>

      <Grid>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard label={t('inventory.summaryProducts')} value={summary?.productCount ?? '—'} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('inventory.summaryTotalGrams')}
            value={formatGrams(summary?.totalStockGrams)}
            hint={`${summary?.productsTrackedGrams ?? 0} ${t('inventory.summaryTrackedGrams')}`}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('inventory.summaryTotalPieces')}
            value={summary?.totalStockPieces ?? '—'}
            hint={`${summary?.productsTrackedPieces ?? 0} ${t('inventory.summaryTrackedPieces')}`}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 4, md: 3 }}>
          <StatCard
            label={t('inventory.summaryOutOfStockGrams')}
            value={summary?.outOfStockGrams ?? '—'}
            hint={`${summary?.outOfStockPieces ?? 0} ${t('inventory.summaryOutOfStockPieces')}`}
          />
        </Grid.Col>
      </Grid>

      <Tabs defaultValue="low">
        <Tabs.List>
          <Tabs.Tab value="low">{t('inventory.lowStock')}</Tabs.Tab>
          <Tabs.Tab value="movements">{t('inventory.movements')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="low" pt="md">
          {lowLoading ? (
            <Loader />
          ) : (lowStock ?? []).length === 0 ? (
            <Alert color="green">—</Alert>
          ) : (
            <Table withTableBorder striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('inventory.colProduct')}</Table.Th>
                  <Table.Th>{t('inventory.colStockGrams')}</Table.Th>
                  <Table.Th>{t('inventory.colThresholdGrams')}</Table.Th>
                  <Table.Th>{t('inventory.colStock')}</Table.Th>
                  <Table.Th>{t('inventory.colThreshold')}</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(lowStock ?? []).map((row) => {
                  const gramsLow =
                    row.stockGrams !== null &&
                    ((row.lowStockGramsThreshold !== null &&
                      row.stockGrams <= row.lowStockGramsThreshold) ||
                      (row.lowStockGramsThreshold === null && row.stockGrams === 0));
                  const piecesLow =
                    row.stock !== null &&
                    ((row.lowStockThreshold !== null && row.stock <= row.lowStockThreshold) ||
                      (row.lowStockThreshold === null && row.stock === 0));
                  return (
                    <Table.Tr key={row.id}>
                      <Table.Td>
                        <Group gap="xs">
                          <Text fw={500}>{row.title}</Text>
                          {gramsLow ? (
                            <Badge size="xs" color="red">
                              {row.stockGrams === 0 ? '0g' : 'low g'}
                            </Badge>
                          ) : null}
                          {piecesLow ? (
                            <Badge size="xs" color="orange">
                              {row.stock === 0 ? '0' : 'low'}
                            </Badge>
                          ) : null}
                        </Group>
                      </Table.Td>
                      <Table.Td>{formatGrams(row.stockGrams)}</Table.Td>
                      <Table.Td>{formatGrams(row.lowStockGramsThreshold)}</Table.Td>
                      <Table.Td>{row.stock ?? '—'}</Table.Td>
                      <Table.Td>{row.lowStockThreshold ?? '—'}</Table.Td>
                      <Table.Td>
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => {
                            setAdjustProduct(row);
                            setDelta('');
                            setReason('RESTOCK');
                            setAdjustOpen(true);
                          }}
                        >
                          {t('inventory.adjustGrams')}
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="movements" pt="md">
          {movLoading ? (
            <Loader />
          ) : (
            <Table withTableBorder striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('inventory.colCreated')}</Table.Th>
                  <Table.Th>{t('inventory.colProduct')}</Table.Th>
                  <Table.Th>{t('inventory.colDelta')}</Table.Th>
                  <Table.Th>{t('inventory.colDeltaGrams')}</Table.Th>
                  <Table.Th>{t('inventory.colReason')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(movements?.items ?? []).map((m) => (
                  <Table.Tr key={m.id}>
                    <Table.Td>{dayjs(m.createdAt).format('YYYY-MM-DD HH:mm')}</Table.Td>
                    <Table.Td>{m.product.title}</Table.Td>
                    <Table.Td c={m.delta < 0 ? 'red' : m.delta > 0 ? 'teal' : undefined}>
                      {m.delta > 0 ? `+${m.delta}` : m.delta || '—'}
                    </Table.Td>
                    <Table.Td c={m.deltaGrams < 0 ? 'red' : m.deltaGrams > 0 ? 'teal' : undefined}>
                      {m.deltaGrams > 0
                        ? `+${m.deltaGrams.toLocaleString('ru-RU')} g`
                        : m.deltaGrams < 0
                          ? `${m.deltaGrams.toLocaleString('ru-RU')} g`
                          : '—'}
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="xs">
                        {m.reason}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>
      </Tabs>

      <Modal
        opened={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title={`${t('inventory.adjustGrams')} — ${adjustProduct?.title ?? ''}`}
      >
        <Stack gap="sm">
          <Text size="xs" c="dimmed">
            {t('inventory.adjustGramsHint')}
          </Text>
          <NumberInput
            label={t('inventory.deltaGrams')}
            value={delta}
            onChange={(v) => setDelta(v === '' ? '' : Number(v))}
            allowDecimal={false}
            thousandSeparator=" "
          />
          <Select
            label={t('inventory.reason')}
            value={reason}
            onChange={(v) => setReason(v ?? 'RESTOCK')}
            data={[
              { value: 'RESTOCK', label: t('inventory.reasonRestock') },
              { value: 'ADMIN_ADJUST', label: t('inventory.reasonAdjust') },
            ]}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setAdjustOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button color="parfum" loading={submitting} onClick={applyAdjust}>
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
