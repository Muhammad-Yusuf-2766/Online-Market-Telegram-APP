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
import { useDebouncedSearch } from '../shared/hooks/useDebouncedSearch';
import { formatPrice } from '../shared/lib/money';
import { ORDER_STATUS_LABEL, ORDER_STATUS_MANTINE_COLOR } from '../shared/lib/orderStatusMantine';

const PAGE_SIZE = 20;
const STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function addressLines(order: AdminOrder) {
  return [
    order.addressNameSnapshot,
    order.roadAddressSnapshot || order.jibunAddressSnapshot,
    order.buildingNameSnapshot,
    order.detailAddressSnapshot,
    order.zoneNoSnapshot ? `Pochta indeksi ${order.zoneNoSnapshot}` : null,
  ].filter(Boolean);
}

export function OrdersPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedSearch(q);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading, isFetching, isError } = useGetOrdersQuery({
    page,
    pageSize: PAGE_SIZE,
    q: debouncedQ || undefined,
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
      notifications.show({ color: 'green', message: 'Buyurtma holati yangilandi.' });
    } catch {
      notifications.show({ color: 'red', message: 'Buyurtma holatini yangilab bo‘lmadi.' });
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={2}>Buyurtmalar</Title>
          <Text size="sm" c="dimmed">
            Buyurtma holati, yetkazish manzili va mahsulot qatorlarini boshqarish.
          </Text>
        </Stack>
        {isFetching ? <Text size="sm" c="dimmed">Yangilanmoqda...</Text> : null}
      </Group>

      <Group align="flex-end">
        <TextInput
          label="Qidirish"
          placeholder="Buyurtma ID, mijoz, Telegram"
          value={q}
          onChange={(e) => {
            setQ(e.currentTarget.value);
            setPage(1);
          }}
          style={{ flex: 1 }}
        />
        <Select
          label="Holati"
          clearable
          data={STATUSES.map((value) => ({ value, label: ORDER_STATUS_LABEL[value] }))}
          value={status}
          onChange={(value) => {
            setStatus((value as OrderStatus | null) ?? '');
            setPage(1);
          }}
        />
      </Group>

      <Paper withBorder radius="md" p="md">
        {isLoading ? (
          <Text c="dimmed">Yuklanmoqda...</Text>
        ) : isError ? (
          <Text c="red">Buyurtmalarni yuklab bo‘lmadi. Qidiruv yoki filter qiymatini tekshirib qayta urinib ko‘ring.</Text>
        ) : (
          <>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Buyurtma</Table.Th>
                  <Table.Th>Mijoz</Table.Th>
                  <Table.Th>Holati</Table.Th>
                  <Table.Th>Mahsulotlar</Table.Th>
                  <Table.Th ta="right">Jami</Table.Th>
                  <Table.Th>Yaratilgan</Table.Th>
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
                      <Badge color={ORDER_STATUS_MANTINE_COLOR[order.status]} variant="light">
                        {ORDER_STATUS_LABEL[order.status]}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{order.items?.length ?? 0}</Table.Td>
                    <Table.Td ta="right">{formatPrice(order.totalKrw)}</Table.Td>
                    <Table.Td>{dayjs(order.createdAt).format('DD.MM.YYYY HH:mm')}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {(data?.items?.length ?? 0) === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="md">
                Buyurtmalar topilmadi.
              </Text>
            ) : null}
            <Group justify="center" mt="md">
              <Pagination total={totalPages} value={page} onChange={setPage} />
            </Group>
          </>
        )}
      </Paper>

      <Modal opened={selectedId !== null} onClose={() => setSelectedId(null)} title="Buyurtma tafsilotlari" size="xl">
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
                data={STATUSES.map((value) => ({ value, label: ORDER_STATUS_LABEL[value] }))}
                value={selectedOrder.status}
                disabled={updating}
                onChange={(value) => {
                  if (value) void changeStatus(selectedOrder.id, value as OrderStatus);
                }}
              />
            </Group>

            <Paper withBorder radius="md" p="sm">
              <Text fw={600}>Yetkazish manzili</Text>
              {addressLines(selectedOrder).map((line) => (
                <Text key={line} size="sm">
                  {line}
                </Text>
              ))}
              {selectedOrder.notes ? (
                <Text size="sm" c="dimmed" mt={6}>
                  Izoh: {selectedOrder.notes}
                </Text>
              ) : null}
            </Paper>

            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Mahsulot</Table.Th>
                  <Table.Th>Birlik</Table.Th>
                  <Table.Th>Miqdor</Table.Th>
                  <Table.Th ta="right">Birlik narxi</Table.Th>
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
              <Text>Oraliq jami: {formatPrice(selectedOrder.subtotalKrw)}</Text>
              <Text>Yetkazib berish: {formatPrice(selectedOrder.deliveryFeeKrw ?? 0)}</Text>
              <Text>Chegirma: {formatPrice(selectedOrder.discountKrw)}</Text>
              <Text fw={700}>Jami: {formatPrice(selectedOrder.totalKrw)}</Text>
            </Group>
            <Button variant="default" onClick={() => setSelectedId(null)}>
              Yopish
            </Button>
          </Stack>
        ) : (
          <Text c="dimmed">Yuklanmoqda...</Text>
        )}
      </Modal>
    </Stack>
  );
}
