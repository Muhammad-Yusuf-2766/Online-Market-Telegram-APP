import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useGetMeasurementUnitsQuery,
  useGetProductsQuery,
  useUpdateProductMutation,
  type Product,
  type ProductWritePayload,
} from '../app/parfumApi';
import { formatPrice } from '../shared/lib/money';

const EMPTY_FORM = {
  title: '',
  description: '',
  priceKrw: 0,
  oldPriceKrw: 0,
  discountPercent: 0,
  stockQuantity: 0,
  lowStockThreshold: 5,
  categoryId: '',
  measurementUnitId: '',
  imagesText: '',
  isOnSale: false,
  isBestSeller: false,
  isActive: true,
};

type ProductFormState = typeof EMPTY_FORM;

function formFromProduct(product: Product): ProductFormState {
  return {
    title: product.title,
    description: product.description ?? '',
    priceKrw: product.priceKrw,
    oldPriceKrw: product.oldPriceKrw ?? 0,
    discountPercent: product.discountPercent ?? 0,
    stockQuantity: product.stockQuantity,
    lowStockThreshold: product.lowStockThreshold,
    categoryId: product.categoryId,
    measurementUnitId: product.measurementUnitId,
    imagesText: product.images.join('\n'),
    isOnSale: product.isOnSale,
    isBestSeller: product.isBestSeller,
    isActive: product.isActive,
  };
}

function payloadFromForm(form: ProductFormState): ProductWritePayload {
  const images = form.imagesText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2);

  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    priceKrw: Math.max(0, Math.round(form.priceKrw || 0)),
    oldPriceKrw: form.oldPriceKrw ? Math.max(0, Math.round(form.oldPriceKrw)) : null,
    discountPercent: form.discountPercent ? Math.max(0, Math.round(form.discountPercent)) : null,
    stockQuantity: Math.max(0, Math.round(form.stockQuantity || 0)),
    lowStockThreshold: Math.max(0, Math.round(form.lowStockThreshold || 0)),
    categoryId: form.categoryId,
    measurementUnitId: form.measurementUnitId,
    images,
    isOnSale: form.isOnSale,
    isBestSeller: form.isBestSeller,
    isActive: form.isActive,
  };
}

export function ProductsPage() {
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const { data, isLoading, isFetching } = useGetProductsQuery({
    page: 1,
    pageSize: 100,
    q: q || undefined,
    categoryId: categoryId || undefined,
  });
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: units = [] } = useGetMeasurementUnitsQuery();
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.name })),
    [categories],
  );
  const unitOptions = useMemo(
    () => units.map((unit) => ({ value: unit.id, label: `${unit.name} (${unit.symbol})` })),
    [units],
  );

  useEffect(() => {
    if (editing) {
      setForm(formFromProduct(editing));
    }
  }, [editing]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      categoryId: categories[0]?.id ?? '',
      measurementUnitId: units[0]?.id ?? '',
    });
  };

  async function submit() {
    const payload = payloadFromForm(form);
    if (!payload.title || !payload.categoryId || !payload.measurementUnitId) {
      notifications.show({ color: 'orange', message: 'Title, category, and unit are required' });
      return;
    }
    try {
      if (editing) {
        await updateProduct({ id: editing.id, ...payload }).unwrap();
      } else {
        await createProduct(payload).unwrap();
      }
      setEditing(null);
      setForm(EMPTY_FORM);
      notifications.show({ color: 'green', message: 'Product saved' });
    } catch {
      notifications.show({ color: 'red', message: 'Could not save product' });
    }
  }

  const modalOpen = editing !== null || form !== EMPTY_FORM;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={2}>Products</Title>
          <Text c="dimmed" size="sm">
            Manage halal market products, KRW pricing, measurement units, and stock.
          </Text>
        </Stack>
        <Button color="parfum" leftSection={<IconPlus size={16} />} onClick={openCreate}>
          New Product
        </Button>
      </Group>

      <Group align="flex-end">
        <TextInput
          label="Search"
          placeholder="Product title"
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          label="Category"
          data={categoryOptions}
          value={categoryId}
          clearable
          onChange={setCategoryId}
        />
      </Group>

      <Paper withBorder radius="md" p="md">
        {isLoading ? (
          <Text c="dimmed">Loading...</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Product</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Unit</Table.Th>
                <Table.Th ta="right">Price</Table.Th>
                <Table.Th>Stock</Table.Th>
                <Table.Th>Sections</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data?.items ?? []).map((product) => (
                <Table.Tr key={product.id}>
                  <Table.Td>
                    <Text fw={500}>{product.title}</Text>
                    <Text size="xs" c="dimmed">
                      {product.images.length} image{product.images.length === 1 ? '' : 's'}
                    </Text>
                  </Table.Td>
                  <Table.Td>{product.category?.name ?? '-'}</Table.Td>
                  <Table.Td>{product.measurementUnit?.symbol ?? product.measurementUnit?.name ?? '-'}</Table.Td>
                  <Table.Td ta="right">{formatPrice(product.priceKrw)}</Table.Td>
                  <Table.Td>
                    <Badge color={product.stockQuantity <= product.lowStockThreshold ? 'yellow' : 'green'} variant="light">
                      {product.stockQuantity}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {product.isOnSale ? <Badge size="xs" color="red" variant="light">Sale</Badge> : null}
                      {product.isBestSeller ? <Badge size="xs" color="blue" variant="light">Bestseller</Badge> : null}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={product.isActive ? 'green' : 'gray'} variant="light">
                      {product.isActive ? 'Active' : 'Hidden'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group justify="flex-end" gap={4}>
                      <ActionIcon variant="subtle" onClick={() => setEditing(product)}>
                        <IconPencil size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        loading={deleting}
                        onClick={async () => {
                          if (!window.confirm(`Delete ${product.title}?`)) return;
                          await deleteProduct(product.id).unwrap();
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
        {isFetching && !isLoading ? (
          <Text size="xs" c="dimmed" mt="sm">
            Refreshing...
          </Text>
        ) : null}
      </Paper>

      <Modal
        opened={modalOpen}
        onClose={() => {
          setEditing(null);
          setForm(EMPTY_FORM);
        }}
        title={editing ? 'Edit product' : 'New product'}
        size="xl"
      >
        <Stack>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.currentTarget.value }))}
            />
            <NumberInput
              label="Price (KRW)"
              min={0}
              value={form.priceKrw}
              onChange={(value) => setForm((prev) => ({ ...prev, priceKrw: Number(value) || 0 }))}
            />
            <Select
              label="Category"
              data={categoryOptions}
              value={form.categoryId}
              onChange={(value) => setForm((prev) => ({ ...prev, categoryId: value ?? '' }))}
            />
            <Select
              label="Measurement unit"
              data={unitOptions}
              value={form.measurementUnitId}
              onChange={(value) => setForm((prev) => ({ ...prev, measurementUnitId: value ?? '' }))}
            />
            <NumberInput
              label="Stock quantity"
              min={0}
              value={form.stockQuantity}
              onChange={(value) => setForm((prev) => ({ ...prev, stockQuantity: Number(value) || 0 }))}
            />
            <NumberInput
              label="Low stock threshold"
              min={0}
              value={form.lowStockThreshold}
              onChange={(value) => setForm((prev) => ({ ...prev, lowStockThreshold: Number(value) || 0 }))}
            />
            <NumberInput
              label="Old price (KRW)"
              min={0}
              value={form.oldPriceKrw}
              onChange={(value) => setForm((prev) => ({ ...prev, oldPriceKrw: Number(value) || 0 }))}
            />
            <NumberInput
              label="Discount percent"
              min={0}
              max={100}
              value={form.discountPercent}
              onChange={(value) => setForm((prev) => ({ ...prev, discountPercent: Number(value) || 0 }))}
            />
          </SimpleGrid>
          <Textarea
            label="Description"
            minRows={3}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.currentTarget.value }))}
          />
          <Textarea
            label="Image URLs"
            description="One URL per line; backend accepts up to 2 images."
            minRows={2}
            value={form.imagesText}
            onChange={(e) => setForm((prev) => ({ ...prev, imagesText: e.currentTarget.value }))}
          />
          <Group>
            <Switch
              label="Active"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.currentTarget.checked }))}
            />
            <Switch
              label="Sale section"
              checked={form.isOnSale}
              onChange={(e) => setForm((prev) => ({ ...prev, isOnSale: e.currentTarget.checked }))}
            />
            <Switch
              label="Bestseller section"
              checked={form.isBestSeller}
              onChange={(e) => setForm((prev) => ({ ...prev, isBestSeller: e.currentTarget.checked }))}
            />
          </Group>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setEditing(null);
                setForm(EMPTY_FORM);
              }}
            >
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
