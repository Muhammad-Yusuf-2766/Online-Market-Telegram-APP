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
      notifications.show({ color: 'green', message: 'O‘lchov birligi saqlandi.' });
    } catch {
      notifications.show({ color: 'red', message: 'O‘lchov birligini saqlab bo‘lmadi.' });
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={2}>O‘lchov birliklari</Title>
          <Text c="dimmed" size="sm">
            Mahsulot ko‘rinishi va buyurtma qatorlarida ishlatiladigan birliklar.
          </Text>
        </Stack>
        <Button color="parfum" onClick={openCreate}>
          Yangi birlik
        </Button>
      </Group>

      {isLoading ? (
        <Text c="dimmed">Yuklanmoqda...</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nomi</Table.Th>
              <Table.Th>Kalit so‘z</Table.Th>
              <Table.Th>Belgisi</Table.Th>
              <Table.Th>Tartib</Table.Th>
              <Table.Th>Kasr miqdor</Table.Th>
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
                    {row.allowDecimal ? 'Ruxsat bor' : 'Faqat butun'}
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
                        if (!window.confirm(`«${row.name}» o‘lchov birligi o‘chirilsinmi?`)) return;
                        await deleteUnit(row.id).unwrap();
                        notifications.show({ color: 'green', message: 'O‘lchov birligi o‘chirildi.' });
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
      {!isLoading && data.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="md">
          O‘lchov birliklari topilmadi.
        </Text>
      ) : null}

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Birlikni tahrirlash' : 'Yangi birlik'}>
        <Stack>
          <TextInput label="Kalit so‘z" value={slug} onChange={(e) => setSlug(e.currentTarget.value)} />
          <TextInput label="Nomi" value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <TextInput label="Belgisi" value={symbol} onChange={(e) => setSymbol(e.currentTarget.value)} />
          <NumberInput label="Tartib raqami" value={sortOrder} onChange={(value) => setSortOrder(Number(value) || 0)} />
          <Switch
            label="Kasr miqdorga ruxsat"
            checked={allowDecimal}
            onChange={(e) => setAllowDecimal(e.currentTarget.checked)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button color="parfum" loading={creating || updating} onClick={submit}>
              Saqlash
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
