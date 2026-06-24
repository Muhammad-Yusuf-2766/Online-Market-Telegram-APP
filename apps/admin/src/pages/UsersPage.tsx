import { Button, Group, Pagination, Paper, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetUsersQuery } from '../app/parfumApi';

const PAGE_SIZE = 20;

export function UsersPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError } = useGetUsersQuery({
    page,
    pageSize: PAGE_SIZE,
    q: q || undefined,
  });
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE)),
    [data?.total],
  );

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={2}>Users</Title>
          <Text c="dimmed" size="sm">
            Telegram users, saved addresses, order counts, wishlist, and cart activity.
          </Text>
        </Stack>
        {isFetching ? <Text size="sm" c="dimmed">Refreshing...</Text> : null}
      </Group>

      <TextInput
        label="Search"
        placeholder="Telegram ID, username, name, phone"
        value={q}
        onChange={(e) => {
          setQ(e.currentTarget.value);
          setPage(1);
        }}
      />

      <Paper withBorder radius="md" p="md">
        {isError ? (
          <Text c="red" size="sm">
            User admin endpoints are not available from the current backend module.
          </Text>
        ) : isLoading ? (
          <Text c="dimmed">Loading...</Text>
        ) : (
          <>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Telegram</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Addresses</Table.Th>
                  <Table.Th>Orders</Table.Th>
                  <Table.Th>Joined</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(data?.items ?? []).map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Text fw={500}>{[user.firstName, user.lastName].filter(Boolean).join(' ') || '-'}</Text>
                      <Text size="xs" c="dimmed">
                        {user.telegramUsername ? `@${user.telegramUsername}` : user.id}
                      </Text>
                    </Table.Td>
                    <Table.Td>{user.telegramId}</Table.Td>
                    <Table.Td>{user.phone ?? '-'}</Table.Td>
                    <Table.Td>{user._count?.addresses ?? user.addresses?.length ?? '-'}</Table.Td>
                    <Table.Td>{user._count?.orders ?? '-'}</Table.Td>
                    <Table.Td>{dayjs(user.createdAt).format('DD.MM.YYYY')}</Table.Td>
                    <Table.Td ta="right">
                      <Button component={Link} to={`/users/${user.id}`} size="xs" variant="light" color="parfum">
                        Details
                      </Button>
                    </Table.Td>
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
    </Stack>
  );
}
