import {
  ActionIcon,
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryMutation,
  type CategoryRow,
} from '../app/parfumApi';

export function CategoriesPage() {
  const { data = [], isLoading } = useGetCategoriesQuery();
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: deleting }] = useDeleteCategoryMutation();
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [removing, setRemoving] = useState<CategoryRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  function openCreate() {
    setEditing(null);
    setSlug('');
    setName('');
    setSortOrder(data.length);
    setModalOpen(true);
  }

  function openEdit(row: CategoryRow) {
    setEditing(row);
    setSlug(row.slug);
    setName(row.name);
    setSortOrder(row.sortOrder ?? 0);
    setModalOpen(true);
  }

  async function submit() {
    if (!slug.trim() || !name.trim()) return;
    try {
      if (editing) {
        await updateCategory({
          id: editing.id,
          slug: slug.trim(),
          name: name.trim(),
          sortOrder: Math.round(sortOrder),
        }).unwrap();
      } else {
        await createCategory({
          slug: slug.trim(),
          name: name.trim(),
          sortOrder: Math.round(sortOrder),
        }).unwrap();
      }
      setModalOpen(false);
      notifications.show({ color: 'green', message: 'Bo‘lim saqlandi.' });
    } catch {
      notifications.show({ color: 'red', message: 'Bo‘limni saqlab bo‘lmadi.' });
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={2}>Bo‘limlar</Title>
          <Text size="sm" c="dimmed">
            Mahsulot bo‘limlarini yaratish, tahrirlash va tartiblash.
          </Text>
        </Stack>
        <Button color="parfum" leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Yangi bo‘lim
        </Button>
      </Group>

      <Paper withBorder radius="md" p="md">
        {isLoading ? (
          <Text c="dimmed">Yuklanmoqda...</Text>
        ) : (
          <Table withTableBorder striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nomi</Table.Th>
                <Table.Th>Kalit so‘z</Table.Th>
                <Table.Th>Tartib</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{row.name}</Table.Td>
                  <Table.Td>{row.slug}</Table.Td>
                  <Table.Td>{row.sortOrder ?? 0}</Table.Td>
                  <Table.Td>
                    <Group justify="flex-end" gap={4}>
                      <ActionIcon variant="subtle" onClick={() => openEdit(row)}>
                        <IconPencil size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="red" onClick={() => setRemoving(row)}>
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
            Bo‘limlar topilmadi.
          </Text>
        ) : null}
      </Paper>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Bo‘limni tahrirlash' : 'Yangi bo‘lim'}>
        <Stack>
          <TextInput label="Kalit so‘z" value={slug} onChange={(e) => setSlug(e.currentTarget.value)} />
          <TextInput label="Nomi" value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <NumberInput label="Tartib raqami" value={sortOrder} onChange={(value) => setSortOrder(Number(value) || 0)} />
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

      <Modal opened={removing !== null} onClose={() => setRemoving(null)} title="Bo‘limni o‘chirish">
        <Text size="sm">«{removing?.name}» bo‘limi o‘chirilsinmi? Bu amalni qaytarib bo‘lmaydi.</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setRemoving(null)}>
            Bekor qilish
          </Button>
          <Button
            color="red"
            loading={deleting}
            onClick={async () => {
              if (!removing) return;
              try {
                await deleteCategory(removing.id).unwrap();
                setRemoving(null);
                notifications.show({ color: 'green', message: 'Bo‘lim o‘chirildi.' });
              } catch {
                notifications.show({ color: 'red', message: 'Bo‘limni o‘chirib bo‘lmadi.' });
              }
            }}
          >
            O‘chirish
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}
