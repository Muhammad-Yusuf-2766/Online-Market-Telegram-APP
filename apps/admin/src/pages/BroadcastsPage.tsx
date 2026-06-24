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
import { IconSend } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useState } from 'react';
import {
  useCreateBroadcastMutation,
  useGetBroadcastsQuery,
  useSendBroadcastNowMutation,
  type BroadcastRow,
} from '../app/parfumApi';

export function BroadcastsPage() {
  const { data = [], isLoading } = useGetBroadcastsQuery();
  const [createBroadcast, { isLoading: creating }] = useCreateBroadcastMutation();
  const [sendBroadcast, { isLoading: sending }] = useSendBroadcastNowMutation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [confirming, setConfirming] = useState<BroadcastRow | null>(null);

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
      notifications.show({ color: 'green', message: 'Broadcast draft created' });
    } catch {
      notifications.show({ color: 'red', message: 'Could not create broadcast' });
    }
  }

  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Title order={2}>Broadcasts</Title>
        <Text c="dimmed" size="sm">
          Create and send Telegram messages to Ansor Market customers.
        </Text>
      </Stack>

      <Paper withBorder radius="md" p="md">
        <Stack>
          <Group grow align="flex-start">
            <TextInput label="Title" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
            <TextInput label="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.currentTarget.value)} />
            <TextInput label="Target URL" value={targetUrl} onChange={(e) => setTargetUrl(e.currentTarget.value)} />
          </Group>
          <Textarea label="Message" minRows={4} value={body} onChange={(e) => setBody(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button color="parfum" loading={creating} onClick={submit}>
              Create Draft
            </Button>
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder radius="md" p="md">
        <Group justify="space-between">
          <Title order={4}>History</Title>
          {isLoading ? <Text size="sm" c="dimmed">Loading...</Text> : null}
        </Group>
        <Table striped highlightOnHover mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Sent</Table.Th>
              <Table.Th>Errors</Table.Th>
              <Table.Th>Created</Table.Th>
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
                  <Badge variant="light">{row.status}</Badge>
                </Table.Td>
                <Table.Td>{row.sentCount}</Table.Td>
                <Table.Td>{row.errorCount}</Table.Td>
                <Table.Td>{dayjs(row.createdAt).format('DD.MM.YYYY HH:mm')}</Table.Td>
                <Table.Td ta="right">
                  <ActionIcon variant="subtle" color="parfum" onClick={() => setConfirming(row)}>
                    <IconSend size={18} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={confirming !== null} onClose={() => setConfirming(null)} title="Send broadcast now">
        <Text size="sm">
          Send "{confirming?.title}" to Telegram users now?
        </Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setConfirming(null)}>
            Cancel
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
                  message: `Sent ${result.sent}; errors ${result.errors}`,
                });
              } catch {
                notifications.show({ color: 'red', message: 'Could not send broadcast' });
              }
            }}
          >
            Send
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}
