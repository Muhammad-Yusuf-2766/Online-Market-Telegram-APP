import { Button, Group, Paper, SimpleGrid, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useGetFinanceReportQuery } from '../app/parfumApi';
import { formatPrice } from '../shared/lib/money';
import { ORDER_STATUS_LABEL } from '../shared/lib/orderStatusMantine';

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
          <Title order={2}>Moliya</Title>
          <Text c="dimmed" size="sm">
            Buyurtma summalarini kun, holat, mahsulot va bo‘lim bo‘yicha ko‘rish.
          </Text>
        </Stack>
        <Group align="flex-end">
          <TextInput label="Boshlanish" type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.currentTarget.value)} />
          <TextInput label="Tugash" type="date" value={draftTo} onChange={(e) => setDraftTo(e.currentTarget.value)} />
          <Button color="parfum" loading={isFetching} onClick={() => setRange({ from: draftFrom, to: draftTo })}>
            Qo‘llash
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Kpi label="Umumiy daromad" value={data ? formatPrice(data.kpis.grossRevenueKrw) : '-'} />
        <Kpi label="Yetkazilgan daromad" value={data ? formatPrice(data.kpis.deliveredRevenueKrw) : '-'} />
        <Kpi label="Kutilayotgan summa" value={data ? formatPrice(data.kpis.pendingOrderAmountKrw) : '-'} />
        <Kpi label="O‘rtacha buyurtma" value={data ? formatPrice(data.kpis.averageOrderValueKrw) : '-'} hint={data ? `${data.kpis.totalOrders} ta buyurtma` : undefined} />
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Title order={4}>Kunlik daromad</Title>
        <Table striped highlightOnHover mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Sana</Table.Th>
              <Table.Th>Buyurtmalar</Table.Th>
              <Table.Th>Bekor qilingan</Table.Th>
              <Table.Th ta="right">Daromad</Table.Th>
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
          <Title order={4}>Holatlar bo‘yicha</Title>
          <Table striped mt="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Holati</Table.Th>
                <Table.Th>Buyurtmalar</Table.Th>
                <Table.Th ta="right">Summa</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data?.byStatus ?? []).map((row) => (
                <Table.Tr key={row.status}>
                  <Table.Td>{ORDER_STATUS_LABEL[row.status]}</Table.Td>
                  <Table.Td>{row.count}</Table.Td>
                  <Table.Td ta="right">{formatPrice(row.amountKrw)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Title order={4}>Eng ko‘p sotilgan mahsulotlar</Title>
          <Table striped mt="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Mahsulot</Table.Th>
                <Table.Th>Miqdor</Table.Th>
                <Table.Th ta="right">Daromad</Table.Th>
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
        <Title order={4}>Eng ko‘p sotilgan bo‘limlar</Title>
        <Table striped mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Bo‘lim</Table.Th>
              <Table.Th>Miqdor</Table.Th>
              <Table.Th ta="right">Daromad</Table.Th>
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
