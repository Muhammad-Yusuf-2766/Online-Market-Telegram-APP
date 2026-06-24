import {
  Badge,
  Button,
  Group,
  Modal,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import {
  useGetAdminOrderQuery,
  useGetOrdersQuery,
  useUpdateOrderStatusMutation,
  type AdminOrder,
  type OrderStatus,
} from '../app/parfumApi';
import { formatPrice } from '../shared/lib/money';

const PAGE_SIZE = 20;
const STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function statusColor(status: OrderStatus) {
  if (status === 'DELIVERED') return 'green';
  if (status === 'CANCELLED') return 'red';
  if (status === 'PENDING') return 'yellow';
  return 'blue';
}

function addressLines(order: AdminOrder) {
  return [
    order.addressNameSnapshot,
    order.roadAddressSnapshot || order.jibunAddressSnapshot,
    order.buildingNameSnapshot,
    order.detailAddressSnapshot,
    order.zoneNoSnapshot ? `Zone ${order.zoneNoSnapshot}` : null,
  ].filter(Boolean);
}

export function OrdersPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading, isFetching } = useGetOrdersQuery({
    page,
    pageSize: PAGE_SIZE,
    q: q || undefined,
    status: status || undefined,
  });
  const { data: selectedOrder } = useGetAdminOrderQuery(selectedId ?? '', { skip: !selectedId });
  const [updateStatus, { isLoading: updating }] = useUpdateOrderStatusMutation();
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE)),
    [data?.total],
  );

  async function changeStatus(id: string, next: OrderStatus) {
    try {
      await updateStatus({ id, status: next }).unwrap();
      notifications.show({ color: 'green', message: 'Order status updated' });
    } catch {
      notifications.show({ color: 'red', message: 'Could not update order status' });
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={2}>Orders</Title>
          <Text size="sm" c="dimmed">
            Manage Ansor Market order status, delivery snapshots, and line items.
          </Text>
        </Stack>
        {isFetching ? <Text size="sm" c="dimmed">Refreshing...</Text> : null}
      </Group>

      <Group align="flex-end">
        <TextInput
          label="Search"
          placeholder="Order ID, customer, Telegram"
          value={q}
          onChange={(e) => {
            setQ(e.currentTarget.value);
            setPage(1);
          }}
          style={{ flex: 1 }}
        />
        <Select
          label="Status"
          clearable
          data={STATUSES}
          value={status}
          onChange={(value) => {
            setStatus((value as OrderStatus | null) ?? '');
            setPage(1);
          }}
        />
      </Group>

      <Paper withBorder radius="md" p="md">
        {isLoading ? (
          <Text c="dimmed">Loading...</Text>
        ) : (
          <>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Order</Table.Th>
                  <Table.Th>Customer</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Items</Table.Th>
                  <Table.Th ta="right">Total</Table.Th>
                  <Table.Th>Created</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(data?.items ?? []).map((order) => (
                  <Table.Tr key={order.id} onClick={() => setSelectedId(order.id)} style={{ cursor: 'pointer' }}>
                    <Table.Td>
                      <Text size="sm" ff="monospace">
                        {order.id.slice(0, 8)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{order.user?.firstName ?? order.user?.telegramUsername ?? '-'}</Text>
                      <Text size="xs" c="dimmed">
                        {order.user?.telegramId ?? order.userId}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={statusColor(order.status)} variant="light">
                        {order.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{order.items?.length ?? 0}</Table.Td>
                    <Table.Td ta="right">{formatPrice(order.totalKrw)}</Table.Td>
                    <Table.Td>{dayjs(order.createdAt).format('DD.MM.YYYY HH:mm')}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Group justify="center" mt="md">
              <Pagination total={totalPages} value={page} onChange={setPage} />
            </Group>
          </>
        )}
      </Paper>

      <Modal opened={selectedId !== null} onClose={() => setSelectedId(null)} title="Order details" size="xl">
        {selectedOrder ? (
          <Stack>
            <Group justify="space-between">
              <Stack gap={2}>
                <Text fw={700}>#{selectedOrder.id}</Text>
                <Text size="sm" c="dimmed">
                  {dayjs(selectedOrder.createdAt).format('DD.MM.YYYY HH:mm')}
                </Text>
              </Stack>
              <Select
                data={STATUSES}
                value={selectedOrder.status}
                disabled={updating}
                onChange={(value) => {
                  if (value) void changeStatus(selectedOrder.id, value as OrderStatus);
                }}
              />
            </Group>

            <Paper withBorder radius="md" p="sm">
              <Text fw={600}>Delivery address</Text>
              {addressLines(selectedOrder).map((line) => (
                <Text key={line} size="sm">
                  {line}
                </Text>
              ))}
              {selectedOrder.notes ? (
                <Text size="sm" c="dimmed" mt={6}>
                  Notes: {selectedOrder.notes}
                </Text>
              ) : null}
            </Paper>

            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Product</Table.Th>
                  <Table.Th>Unit</Table.Th>
                  <Table.Th>Qty</Table.Th>
                  <Table.Th ta="right">Unit price</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {selectedOrder.items.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>{item.titleSnapshot}</Table.Td>
                    <Table.Td>{item.unitSymbolSnapshot ?? item.unitNameSnapshot ?? '-'}</Table.Td>
                    <Table.Td>{item.quantity}</Table.Td>
                    <Table.Td ta="right">{formatPrice(item.unitPriceKrw)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            <Group justify="flex-end">
              <Text>Subtotal: {formatPrice(selectedOrder.subtotalKrw)}</Text>
              <Text>Discount: {formatPrice(selectedOrder.discountKrw)}</Text>
              <Text fw={700}>Total: {formatPrice(selectedOrder.totalKrw)}</Text>
            </Group>
            <Button variant="default" onClick={() => setSelectedId(null)}>
              Close
            </Button>
          </Stack>
        ) : (
          <Text c="dimmed">Loading...</Text>
        )}
      </Modal>
    </Stack>
  );
}
