import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSend, IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useState } from 'react';
import {
  useCreateBroadcastMutation,
  useDeleteBroadcastMutation,
  useGetBroadcastsQuery,
  useSendBroadcastNowMutation,
  type BroadcastRow,
} from '../app/parfumApi';

const BROADCAST_STATUS_LABEL: Record<BroadcastRow['status'], string> = {
  DRAFT: 'Qoralama',
  SENDING: 'Yuborilmoqda',
  SENT: 'Yuborildi',
  FAILED: 'Xatolik bor',
};

export function BroadcastsPage() {
  const { data = [], isLoading } = useGetBroadcastsQuery();
  const [createBroadcast, { isLoading: creating }] = useCreateBroadcastMutation();
  const [sendBroadcast, { isLoading: sending }] = useSendBroadcastNowMutation();
  const [deleteBroadcast, { isLoading: deleting }] = useDeleteBroadcastMutation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [confirming, setConfirming] = useState<BroadcastRow | null>(null);
  const [removing, setRemoving] = useState<BroadcastRow | null>(null);

  async function submit() {
    if (!title.trim() || !body.trim()) return;
    try {
      await createBroadcast({
        title: title.trim(),
        body: body.trim(),
        imageUrl: imageUrl.trim() || null,
        targetUrl: targetUrl.trim() || null,
      }).unwrap();
      setTitle('');
      setBody('');
      setImageUrl('');
      setTargetUrl('');
      notifications.show({ color: 'green', message: 'Xabar qoralamasi yaratildi.' });
    } catch {
      notifications.show({ color: 'red', message: 'Xabar qoralamasini yaratib bo‘lmadi.' });
    }
  }

  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Title order={2}>Xabar tarqatish</Title>
        <Text c="dimmed" size="sm">
          Ansor Market foydalanuvchilariga umumiy Telegram xabarlarini yuborish.
        </Text>
      </Stack>

      <Paper withBorder radius="md" p="md">
        <Stack>
          <Group grow align="flex-start">
            <TextInput label="Sarlavha" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
            <TextInput label="Rasm URL" value={imageUrl} onChange={(e) => setImageUrl(e.currentTarget.value)} />
            <TextInput label="Havola URL" value={targetUrl} onChange={(e) => setTargetUrl(e.currentTarget.value)} />
          </Group>
          <Textarea label="Xabar matni" minRows={4} value={body} onChange={(e) => setBody(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button color="parfum" loading={creating} onClick={submit}>
              Qoralama yaratish
            </Button>
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder radius="md" p="md">
        <Group justify="space-between">
          <Title order={4}>Xabarlar tarixi</Title>
          {isLoading ? <Text size="sm" c="dimmed">Yuklanmoqda...</Text> : null}
        </Group>
        <Table striped highlightOnHover mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Sarlavha</Table.Th>
              <Table.Th>Holati</Table.Th>
              <Table.Th>Yuborildi</Table.Th>
              <Table.Th>Xatolar</Table.Th>
              <Table.Th>Yaratilgan</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <Text fw={500}>{row.title}</Text>
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {row.body}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light">{BROADCAST_STATUS_LABEL[row.status]}</Badge>
                </Table.Td>
                <Table.Td>{row.sentCount}</Table.Td>
                <Table.Td>{row.errorCount}</Table.Td>
                <Table.Td>{dayjs(row.createdAt).format('DD.MM.YYYY HH:mm')}</Table.Td>
                <Table.Td ta="right">
                  <Group justify="flex-end" gap={4}>
                    <ActionIcon variant="subtle" color="parfum" onClick={() => setConfirming(row)}>
                      <IconSend size={18} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => setRemoving(row)}>
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        {!isLoading && data.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">
            Xabarlar topilmadi.
          </Text>
        ) : null}
      </Paper>

      <Modal opened={confirming !== null} onClose={() => setConfirming(null)} title="Xabarni hozir yuborish">
        <Text size="sm">
          «{confirming?.title}» xabari barcha foydalanuvchilarga yuborilsinmi?
        </Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setConfirming(null)}>
            Bekor qilish
          </Button>
          <Button
            color="parfum"
            leftSection={<IconSend size={16} />}
            loading={sending}
            onClick={async () => {
              if (!confirming) return;
              try {
                const result = await sendBroadcast(confirming.id).unwrap();
                setConfirming(null);
                notifications.show({
                  color: 'green',
                  message: `Yuborildi: ${result.sent}; xatolar: ${result.errors}`,
                });
              } catch {
                notifications.show({ color: 'red', message: 'Xabarni yuborib bo‘lmadi.' });
              }
            }}
          >
            Yuborish
          </Button>
        </Group>
      </Modal>

      <Modal opened={removing !== null} onClose={() => setRemoving(null)} title="Xabarni o‘chirish">
        <Text size="sm">«{removing?.title}» xabari o‘chirilsinmi? Bu amalni qaytarib bo‘lmaydi.</Text>
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
                await deleteBroadcast(removing.id).unwrap();
                setRemoving(null);
                notifications.show({ color: 'green', message: 'Xabar o‘chirildi.' });
              } catch {
                notifications.show({ color: 'red', message: 'Xabarni o‘chirib bo‘lmadi.' });
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
