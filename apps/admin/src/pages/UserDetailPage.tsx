import { Badge, Button, Group, Paper, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import dayjs from 'dayjs';
import { Link, useParams } from 'react-router-dom';
import { useGetUserDetails360Query } from '../app/parfumApi';
import { formatPrice } from '../shared/lib/money';

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
    return <Text c="dimmed">Loading...</Text>;
  }

  if (isError || !data) {
    return (
      <Stack>
        <Button component={Link} to="/users" variant="subtle" color="parfum">
          Back to users
        </Button>
        <Text c="red">User detail endpoint is not available from the current backend module.</Text>
      </Stack>
    );
  }

  const { user, addresses, orders, wishlistItems, cartItems, kpis } = data;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Stack gap={4}>
          <Button component={Link} to="/users" variant="subtle" color="parfum" w="fit-content">
            Back to users
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
        <Stat label="Orders" value={kpis.orderCount} />
        <Stat label="Spent" value={formatPrice(kpis.totalSpentKrw)} />
        <Stat label="Wishlist" value={kpis.wishlistCount} />
        <Stat label="Cart items" value={kpis.cartItemCount} />
        <Stat label="Addresses" value={kpis.addressCount} />
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Title order={4}>Saved Addresses</Title>
        <Table striped mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Label</Table.Th>
              <Table.Th>Recipient</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Address</Table.Th>
              <Table.Th>Default</Table.Th>
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
                <Table.Td>{address.isDefault ? 'Yes' : 'No'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <Paper withBorder radius="md" p="md">
        <Title order={4}>Orders</Title>
        <Table striped mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Order</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th ta="right">Total</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {orders.map((order) => (
              <Table.Tr key={order.id}>
                <Table.Td>{order.id.slice(0, 8)}</Table.Td>
                <Table.Td>{order.status}</Table.Td>
                <Table.Td>{dayjs(order.createdAt).format('DD.MM.YYYY HH:mm')}</Table.Td>
                <Table.Td ta="right">{formatPrice(order.totalKrw)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Paper withBorder radius="md" p="md">
          <Title order={4}>Wishlist</Title>
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
          <Title order={4}>Cart</Title>
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
