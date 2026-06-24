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
        message: `${product.title} stock is now ${result.stockQuantity}`,
      });
      setProduct(null);
      setDelta(0);
      setReason('');
    } catch {
      notifications.show({ color: 'red', message: 'Could not adjust inventory' });
    }
  }

  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Title order={2}>Inventory</Title>
        <Text c="dimmed" size="sm">
          Track stock quantity, low-stock products, and inventory movements.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Summary label="Products" value={summary?.productCount ?? '-'} />
        <Summary label="Total stock" value={summary?.totalStockQuantity ?? '-'} />
        <Summary label="Low stock" value={summary?.lowStockCount ?? '-'} />
        <Summary label="Out of stock" value={summary?.outOfStockCount ?? '-'} />
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Title order={4}>Low Stock</Title>
        <Table striped highlightOnHover mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Product</Table.Th>
              <Table.Th>Category</Table.Th>
              <Table.Th>Unit</Table.Th>
              <Table.Th>Stock</Table.Th>
              <Table.Th>Threshold</Table.Th>
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
                    Adjust
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <Paper withBorder radius="md" p="md">
        <Title order={4}>Movements</Title>
        <Table striped mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Product</Table.Th>
              <Table.Th>Delta</Table.Th>
              <Table.Th>Reason</Table.Th>
              <Table.Th>Order</Table.Th>
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
      </Paper>

      <Modal opened={product !== null} onClose={() => setProduct(null)} title="Adjust inventory">
        <Stack>
          <Text fw={600}>{product?.title}</Text>
          <NumberInput
            label="Delta"
            description="Use a positive number to add stock or a negative number to remove stock."
            value={delta}
            onChange={(value) => setDelta(Number(value) || 0)}
          />
          <TextInput label="Reason" value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setProduct(null)}>
              Cancel
            </Button>
            <Button color="parfum" loading={adjusting} onClick={submitAdjustment}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
