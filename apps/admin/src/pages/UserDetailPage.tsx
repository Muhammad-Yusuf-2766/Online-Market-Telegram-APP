import { Badge, Button, Group, Paper, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import dayjs from 'dayjs';
import { Link, useParams } from 'react-router-dom';
import { useGetUserDetails360Query } from '../app/parfumApi';
import { formatPrice } from '../shared/lib/money';
import { ORDER_STATUS_LABEL } from '../shared/lib/orderStatusMantine';

function Stat({ label, value }: { label: string; value: string | number }) {
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

export function UserDetailPage() {
  const { userId = '' } = useParams();
  const { data, isLoading, isError } = useGetUserDetails360Query(userId, { skip: !userId });

  if (isLoading) {
    return <Text c="dimmed">Yuklanmoqda...</Text>;
  }

  if (isError || !data) {
    return (
      <Stack>
        <Button component={Link} to="/users" variant="subtle" color="parfum">
          Foydalanuvchilarga qaytish
        </Button>
        <Text c="red">Foydalanuvchi tafsilotlarini yuklab bo‘lmadi.</Text>
      </Stack>
    );
  }

  const { user, addresses, orders, wishlistItems, cartItems, kpis } = data;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Stack gap={4}>
          <Button component={Link} to="/users" variant="subtle" color="parfum" w="fit-content">
            Foydalanuvchilarga qaytish
          </Button>
          <Title order={2}>{[user.firstName, user.lastName].filter(Boolean).join(' ') || user.telegramId}</Title>
          <Text c="dimmed" size="sm">
            {user.telegramUsername ? `@${user.telegramUsername}` : user.id}
          </Text>
        </Stack>
        <Badge variant="light" color="parfum">
          Telegram {user.telegramId}
        </Badge>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }}>
        <Stat label="Buyurtmalar" value={kpis.orderCount} />
        <Stat label="Sarflangan" value={formatPrice(kpis.totalSpentKrw)} />
        <Stat label="Istaklar" value={kpis.wishlistCount} />
        <Stat label="Savatdagi mahsulotlar" value={kpis.cartItemCount} />
        <Stat label="Manzillar" value={kpis.addressCount} />
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Title order={4}>Saqlangan manzillar</Title>
        <Table striped mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nomi</Table.Th>
              <Table.Th>Qabul qiluvchi</Table.Th>
              <Table.Th>Telefon</Table.Th>
              <Table.Th>Manzil</Table.Th>
              <Table.Th>Asosiy</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {addresses.map((address) => (
              <Table.Tr key={address.id}>
                <Table.Td>{address.label}</Table.Td>
                <Table.Td>{address.recipientName ?? '-'}</Table.Td>
                <Table.Td>{address.phone ?? '-'}</Table.Td>
                <Table.Td>
                  <Text size="sm">{address.roadAddressName || address.addressName}</Text>
                  <Text size="xs" c="dimmed">
                    {[address.jibunAddressName, address.detailAddress, address.zoneNo]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </Table.Td>
                <Table.Td>{address.isDefault ? 'Ha' : 'Yo‘q'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <Paper withBorder radius="md" p="md">
        <Title order={4}>Buyurtmalar</Title>
        <Table striped mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Buyurtma</Table.Th>
              <Table.Th>Holati</Table.Th>
              <Table.Th>Yaratilgan</Table.Th>
              <Table.Th ta="right">Jami</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {orders.map((order) => (
              <Table.Tr key={order.id}>
                <Table.Td>{order.id.slice(0, 8)}</Table.Td>
                <Table.Td>{ORDER_STATUS_LABEL[order.status]}</Table.Td>
                <Table.Td>{dayjs(order.createdAt).format('DD.MM.YYYY HH:mm')}</Table.Td>
                <Table.Td ta="right">{formatPrice(order.totalKrw)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Paper withBorder radius="md" p="md">
          <Title order={4}>Istaklar</Title>
          <Table striped mt="sm">
            <Table.Tbody>
              {wishlistItems.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.product.title}</Table.Td>
                  <Table.Td ta="right">{formatPrice(item.product.priceKrw)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
        <Paper withBorder radius="md" p="md">
          <Title order={4}>Savat</Title>
          <Table striped mt="sm">
            <Table.Tbody>
              {cartItems.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.product.title}</Table.Td>
                  <Table.Td>{item.qty}</Table.Td>
                  <Table.Td ta="right">{formatPrice(item.product.priceKrw)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
