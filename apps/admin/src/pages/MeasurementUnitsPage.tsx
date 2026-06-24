import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import {
  useCreateMeasurementUnitMutation,
  useDeleteMeasurementUnitMutation,
  useGetMeasurementUnitsQuery,
  useUpdateMeasurementUnitMutation,
  type MeasurementUnit,
} from '../app/parfumApi';

export function MeasurementUnitsPage() {
  const { data = [], isLoading } = useGetMeasurementUnitsQuery();
  const [createUnit, { isLoading: creating }] = useCreateMeasurementUnitMutation();
  const [updateUnit, { isLoading: updating }] = useUpdateMeasurementUnitMutation();
  const [deleteUnit, { isLoading: deleting }] = useDeleteMeasurementUnitMutation();
  const [editing, setEditing] = useState<MeasurementUnit | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [allowDecimal, setAllowDecimal] = useState(false);

  function openCreate() {
    setEditing(null);
    setSlug('');
    setName('');
    setSymbol('');
    setSortOrder(data.length);
    setAllowDecimal(false);
    setModalOpen(true);
  }

  function openEdit(row: MeasurementUnit) {
    setEditing(row);
    setSlug(row.slug);
    setName(row.name);
    setSymbol(row.symbol);
    setSortOrder(row.sortOrder);
    setAllowDecimal(row.allowDecimal);
    setModalOpen(true);
  }

  async function submit() {
    if (!slug.trim() || !name.trim() || !symbol.trim()) return;
    try {
      if (editing) {
        await updateUnit({
          id: editing.id,
          slug: slug.trim().toLowerCase(),
          name: name.trim(),
          symbol: symbol.trim(),
          sortOrder: Math.round(sortOrder),
          allowDecimal,
        }).unwrap();
      } else {
        await createUnit({
          slug: slug.trim().toLowerCase(),
          name: name.trim(),
          symbol: symbol.trim(),
          sortOrder: Math.round(sortOrder),
          allowDecimal,
        }).unwrap();
      }
      setModalOpen(false);
      notifications.show({ color: 'green', message: 'Measurement unit saved' });
    } catch {
      notifications.show({ color: 'red', message: 'Could not save measurement unit' });
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={2}>Measurement Units</Title>
          <Text c="dimmed" size="sm">
            Units used for product display and order item snapshots.
          </Text>
        </Stack>
        <Button color="parfum" onClick={openCreate}>
          New Unit
        </Button>
      </Group>

      {isLoading ? (
        <Text c="dimmed">Loading...</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Slug</Table.Th>
              <Table.Th>Symbol</Table.Th>
              <Table.Th>Sort</Table.Th>
              <Table.Th>Decimal</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{row.name}</Table.Td>
                <Table.Td>{row.slug}</Table.Td>
                <Table.Td>{row.symbol}</Table.Td>
                <Table.Td>{row.sortOrder}</Table.Td>
                <Table.Td>
                  <Badge color={row.allowDecimal ? 'blue' : 'gray'} variant="light">
                    {row.allowDecimal ? 'Allowed' : 'Whole only'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group justify="flex-end" gap={4}>
                    <ActionIcon variant="subtle" onClick={() => openEdit(row)}>
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      loading={deleting}
                      onClick={async () => {
                        if (!window.confirm(`Delete ${row.name}?`)) return;
                        await deleteUnit(row.id).unwrap();
                      }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit unit' : 'New unit'}>
        <Stack>
          <TextInput label="Slug" value={slug} onChange={(e) => setSlug(e.currentTarget.value)} />
          <TextInput label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <TextInput label="Symbol" value={symbol} onChange={(e) => setSymbol(e.currentTarget.value)} />
          <NumberInput label="Sort order" value={sortOrder} onChange={(value) => setSortOrder(Number(value) || 0)} />
          <Switch
            label="Allow decimal quantities"
            checked={allowDecimal}
            onChange={(e) => setAllowDecimal(e.currentTarget.checked)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button color="parfum" loading={creating || updating} onClick={submit}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
