import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type SizePreset,
  useCreateSizePresetMutation,
  useDeleteSizePresetMutation,
  useGetSizePresetsQuery,
  useUpdateSizePresetMutation,
} from '../app/parfumApi';
import { useListSearchParams } from '../shared/lib/useListSearchParams';
import { paginationFromTotal } from '../shared/lib/serverPagination';
import { TablePaginationFooter } from '../shared/ui/TablePaginationFooter';

function coerceNumberInput(v: string | number | undefined): number | '' {
  if (v === '' || v === undefined) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? Math.trunc(v) : '';
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : '';
}

export function SizePresetsPage() {
  const { t } = useTranslation();
  const { page, setPage, pageSize, setPageSize } = useListSearchParams(25);
  const { data, isLoading, error } = useGetSizePresetsQuery({ page, pageSize });
  const [createOpen, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editing, setEditing] = useState<SizePreset | null>(null);
  const [deleting, setDeleting] = useState<SizePreset | null>(null);

  const [createPreset, { isLoading: creating }] = useCreateSizePresetMutation();
  const [updatePreset, { isLoading: updating }] = useUpdateSizePresetMutation();
  const [removePreset, { isLoading: removing }] = useDeleteSizePresetMutation();

  const [slug, setSlug] = useState('');
  const [label, setLabel] = useState('');
  const [grams, setGrams] = useState<number | ''>('');
  const [sortOrder, setSortOrder] = useState<number | ''>(0);

  useEffect(() => {
    if (createOpen && !editing) {
      setSlug('');
      setLabel('');
      setGrams('');
      setSortOrder(0);
    }
  }, [createOpen, editing]);

  useEffect(() => {
    if (editing) {
      setSlug(editing.slug);
      setLabel(editing.label);
      setGrams(editing.grams);
      setSortOrder(editing.sortOrder);
    }
  }, [editing]);

  const total = data?.total ?? 0;
  const { totalPages, rangeStart, rangeEnd, effectivePage } = paginationFromTotal(
    total,
    page,
    pageSize,
  );

  useEffect(() => {
    if (page !== effectivePage) {
      setPage(effectivePage);
    }
  }, [page, effectivePage, setPage]);

  const rows = (data?.items ?? []).map((p) => (
    <Table.Tr key={p.id}>
      <Table.Td>
        <Text fw={600}>{p.slug}</Text>
      </Table.Td>
      <Table.Td>{p.label}</Table.Td>
      <Table.Td>{p.grams}</Table.Td>
      <Table.Td>{p.sortOrder}</Table.Td>
      <Table.Td>
        <Group gap={4}>
          <ActionIcon variant="subtle" color="parfum" onClick={() => setEditing(p)}>
            <IconPencil size={18} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => setDeleting(p)}>
            <IconTrash size={18} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>{t('sizePresets.title')}</Title>
        <Button leftSection={<IconPlus size={18} />} color="parfum" onClick={openCreate}>
          {t('sizePresets.add')}
        </Button>
      </Group>

      <Text size="sm" c="dimmed">
        {t('sizePresets.intro')}
      </Text>

      {error ? (
        <Alert color="red" title={t('sizePresets.loadErrorTitle')}>
          {t('sizePresets.loadErrorBody')}
        </Alert>
      ) : null}

      {isLoading ? (
        <Loader />
      ) : (
        <>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('sizePresets.colSlug')}</Table.Th>
                <Table.Th>{t('sizePresets.colLabel')}</Table.Th>
                <Table.Th>{t('sizePresets.colGrams')}</Table.Th>
                <Table.Th>{t('sizePresets.colSort')}</Table.Th>
                <Table.Th w={100} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
          {total > 0 ? (
            <TablePaginationFooter
              page={effectivePage}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              totalItems={total}
            />
          ) : null}
        </>
      )}

      <Modal opened={createOpen} onClose={closeCreate} title={t('sizePresets.modalNew')}>
        <Stack gap="sm">
          <TextInput label={t('sizePresets.colSlug')} value={slug} onChange={(e) => setSlug(e.currentTarget.value)} placeholder="10g" />
          <TextInput label={t('sizePresets.colLabel')} value={label} onChange={(e) => setLabel(e.currentTarget.value)} placeholder="10 g" />
          <NumberInput label={t('sizePresets.colGrams')} value={grams} onChange={(v) => setGrams(coerceNumberInput(v))} min={1} allowDecimal={false} />
          <NumberInput label={t('sizePresets.colSort')} value={sortOrder} onChange={(v) => setSortOrder(coerceNumberInput(v))} allowDecimal={false} />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeCreate}>
              {t('common.cancel')}
            </Button>
            <Button
              color="parfum"
              loading={creating}
              onClick={async () => {
                const g = typeof grams === 'number' ? grams : Number(grams);
                if (!slug.trim() || !label.trim() || Number.isNaN(g) || g < 1) return;
                await createPreset({
                  slug: slug.trim(),
                  label: label.trim(),
                  grams: g,
                  sortOrder: typeof sortOrder === 'number' ? sortOrder : Number(sortOrder) || 0,
                }).unwrap();
                closeCreate();
              }}
            >
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={editing !== null} onClose={() => setEditing(null)} title={t('sizePresets.modalEdit')}>
        {editing ? (
          <Stack gap="sm">
            <TextInput label={t('sizePresets.colSlug')} value={slug} onChange={(e) => setSlug(e.currentTarget.value)} />
            <TextInput label={t('sizePresets.colLabel')} value={label} onChange={(e) => setLabel(e.currentTarget.value)} />
            <NumberInput label={t('sizePresets.colGrams')} value={grams} onChange={(v) => setGrams(coerceNumberInput(v))} min={1} allowDecimal={false} />
            <NumberInput label={t('sizePresets.colSort')} value={sortOrder} onChange={(v) => setSortOrder(coerceNumberInput(v))} allowDecimal={false} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setEditing(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                color="parfum"
                loading={updating}
                onClick={async () => {
                  const g = typeof grams === 'number' ? grams : Number(grams);
                  if (!slug.trim() || !label.trim() || Number.isNaN(g) || g < 1) return;
                  await updatePreset({
                    id: editing.id,
                    body: {
                      slug: slug.trim(),
                      label: label.trim(),
                      grams: g,
                      sortOrder: typeof sortOrder === 'number' ? sortOrder : Number(sortOrder) || 0,
                    },
                  }).unwrap();
                  setEditing(null);
                }}
              >
                {t('common.save')}
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>

      <Modal opened={deleting !== null} onClose={() => setDeleting(null)} title={t('sizePresets.modalDelete')}>
        <Text size="sm">{t('sizePresets.deleteConfirm', { label: deleting?.label ?? '' })}</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setDeleting(null)}>
            {t('common.cancel')}
          </Button>
          <Button
            color="red"
            loading={removing}
            onClick={async () => {
              if (!deleting) return;
              await removePreset(deleting.id).unwrap();
              setDeleting(null);
            }}
          >
            {t('common.delete')}
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}
