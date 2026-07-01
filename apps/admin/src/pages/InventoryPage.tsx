import {
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { useState } from 'react';
import {
  useAdjustInventoryMutation,
  useGetInventoryLowStockQuery,
  useGetInventoryMovementsQuery,
  useGetInventorySummaryQuery,
  type Product,
} from '../app/parfumApi';

function Summary({ label, value }: { label: string; value: number | string }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Text size="xs" tt="uppercase" c="dimmed" fw={700}>
        {label}
      </Text>
      <Text size="xl" fw={700} mt={4}>
        {value}
      </Text>
    </Paper>
  );
}

export function InventoryPage() {
  const { data: summary } = useGetInventorySummaryQuery();
  const { data: lowStock = [] } = useGetInventoryLowStockQuery();
  const { data: movements } = useGetInventoryMovementsQuery({ page: 1, pageSize: 50 });
  const [adjustInventory, { isLoading: adjusting }] = useAdjustInventoryMutation();
  const [product, setProduct] = useState<Product | null>(null);
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState('');

  async function submitAdjustment() {
    if (!product || delta === 0) return;
    try {
      const result = await adjustInventory({
        productId: product.id,
        delta: Math.round(delta),
        reason: reason.trim() || undefined,
      }).unwrap();
      notifications.show({
        color: 'green',
        message: `${product.title} qoldig‘i ${result.stockQuantity} bo‘ldi.`,
      });
      setProduct(null);
      setDelta(0);
      setReason('');
    } catch {
      notifications.show({ color: 'red', message: 'Ombor qoldig‘ini yangilab bo‘lmadi.' });
    }
  }

  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Title order={2}>Ombor qoldig‘i</Title>
        <Text c="dimmed" size="sm">
          Qoldiq, kam qolgan mahsulotlar va ombor harakatlarini kuzatish.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Summary label="Mahsulotlar" value={summary?.productCount ?? '-'} />
        <Summary label="Jami qoldiq" value={summary?.totalStockQuantity ?? '-'} />
        <Summary label="Kam qoldiq" value={summary?.lowStockCount ?? '-'} />
        <Summary label="Tugagan" value={summary?.outOfStockCount ?? '-'} />
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Title order={4}>Kam qolgan mahsulotlar</Title>
        <Table striped highlightOnHover mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Mahsulot</Table.Th>
              <Table.Th>Bo‘lim</Table.Th>
              <Table.Th>Birlik</Table.Th>
              <Table.Th>Qoldiq</Table.Th>
              <Table.Th>Chegara</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {lowStock.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{row.title}</Table.Td>
                <Table.Td>{row.category?.name ?? '-'}</Table.Td>
                <Table.Td>{row.measurementUnit?.symbol ?? '-'}</Table.Td>
                <Table.Td>{row.stockQuantity}</Table.Td>
                <Table.Td>{row.lowStockThreshold}</Table.Td>
                <Table.Td ta="right">
                  <Button size="xs" variant="light" color="parfum" onClick={() => setProduct(row)}>
                    Tuzatish
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        {lowStock.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">
            Kam qolgan mahsulotlar topilmadi.
          </Text>
        ) : null}
      </Paper>

      <Paper withBorder radius="md" p="md">
        <Title order={4}>Ombor harakatlari</Title>
        <Table striped mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Sana</Table.Th>
              <Table.Th>Mahsulot</Table.Th>
              <Table.Th>O‘zgarish</Table.Th>
              <Table.Th>Sabab</Table.Th>
              <Table.Th>Buyurtma</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(movements?.items ?? []).map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{dayjs(row.createdAt).format('DD.MM.YYYY HH:mm')}</Table.Td>
                <Table.Td>{row.product.title}</Table.Td>
                <Table.Td>{row.delta > 0 ? `+${row.delta}` : row.delta}</Table.Td>
                <Table.Td>{row.reason ?? '-'}</Table.Td>
                <Table.Td>{row.orderId?.slice(0, 8) ?? '-'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        {(movements?.items?.length ?? 0) === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">
            Ombor harakatlari topilmadi.
          </Text>
        ) : null}
      </Paper>

      <Modal opened={product !== null} onClose={() => setProduct(null)} title="Ombor qoldig‘ini tuzatish">
        <Stack>
          <Text fw={600}>{product?.title}</Text>
          <NumberInput
            label="O‘zgarish"
            description="Qoldiq qo‘shish uchun musbat, kamaytirish uchun manfiy son kiriting."
            value={delta}
            onChange={(value) => setDelta(Number(value) || 0)}
          />
          <TextInput label="Sabab" value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setProduct(null)}>
              Bekor qilish
            </Button>
            <Button color="parfum" loading={adjusting} onClick={submitAdjustment}>
              Saqlash
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
