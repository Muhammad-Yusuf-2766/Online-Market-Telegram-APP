import {
  ActionIcon,
  Badge,
  Button,
  FileInput,
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
import { IconPencil, IconPlus, IconTrash, IconUpload } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useGetMeasurementUnitsQuery,
  useGetProductsQuery,
  useUpdateProductMutation,
  useUploadProductImageMutation,
  type Product,
  type ProductWritePayload,
} from '../app/parfumApi';
import { useDebouncedSearch } from '../shared/hooks/useDebouncedSearch';
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
  const debouncedQ = useDebouncedSearch(q);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const { data, isLoading, isFetching, isError } = useGetProductsQuery({
    page: 1,
    pageSize: 100,
    q: debouncedQ || undefined,
    categoryId: categoryId || undefined,
  });
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: units = [] } = useGetMeasurementUnitsQuery();
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();
  const [uploadProductImage, { isLoading: uploadingImage }] = useUploadProductImageMutation();

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
      notifications.show({ color: 'orange', message: 'Nomi, bo‘limi va o‘lchov birligi majburiy.' });
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
      notifications.show({ color: 'green', message: 'Mahsulot saqlandi.' });
    } catch {
      notifications.show({ color: 'red', message: 'Mahsulotni saqlab bo‘lmadi.' });
    }
  }

  async function uploadImage(file: File | null) {
    if (!file) return;
    const currentImages = form.imagesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (currentImages.length >= 2) {
      notifications.show({ color: 'orange', message: 'Mahsulot uchun ko‘pi bilan 2 ta rasm qo‘shiladi.' });
      return;
    }
    try {
      const result = await uploadProductImage(file).unwrap();
      setForm((prev) => {
        const images = prev.imagesText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        return { ...prev, imagesText: [...images, result.url].slice(0, 2).join('\n') };
      });
      notifications.show({ color: 'green', message: 'Rasm yuklandi.' });
    } catch {
      notifications.show({ color: 'red', message: 'Rasmni yuklab bo‘lmadi.' });
    }
  }

  const modalOpen = editing !== null || form !== EMPTY_FORM;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={2}>Mahsulotlar</Title>
          <Text c="dimmed" size="sm">
            Halol mahsulotlar, KRW narxlari, o‘lchov birliklari va ombor qoldig‘ini boshqarish.
          </Text>
        </Stack>
        <Button color="parfum" leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Yangi mahsulot
        </Button>
      </Group>

      <Group align="flex-end">
        <TextInput
          label="Qidirish"
          placeholder="Mahsulot nomi"
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          label="Bo‘lim"
          data={categoryOptions}
          value={categoryId}
          clearable
          onChange={setCategoryId}
        />
      </Group>

      <Paper withBorder radius="md" p="md">
        {isLoading ? (
          <Text c="dimmed">Yuklanmoqda...</Text>
        ) : isError ? (
          <Text c="red">Mahsulotlarni yuklab bo‘lmadi. Qidiruv yoki bo‘lim filterini tekshirib qayta urinib ko‘ring.</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Mahsulot</Table.Th>
                <Table.Th>Bo‘lim</Table.Th>
                <Table.Th>Birlik</Table.Th>
                <Table.Th ta="right">Narx</Table.Th>
                <Table.Th>Qoldiq</Table.Th>
                <Table.Th>Bo‘limlar</Table.Th>
                <Table.Th>Holati</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data?.items ?? []).map((product) => (
                <Table.Tr key={product.id}>
                  <Table.Td>
                    <Text fw={500}>{product.title}</Text>
                    <Text size="xs" c="dimmed">
                      {product.images.length} ta rasm
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
                      {product.isOnSale ? <Badge size="xs" color="red" variant="light">Chegirma</Badge> : null}
                      {product.isBestSeller ? <Badge size="xs" color="blue" variant="light">Ko‘p sotilgan</Badge> : null}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={product.isActive ? 'green' : 'gray'} variant="light">
                      {product.isActive ? 'Faol' : 'Yashirilgan'}
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
                          if (!window.confirm(`«${product.title}» mahsuloti o‘chirilsinmi?`)) return;
                          await deleteProduct(product.id).unwrap();
                          notifications.show({ color: 'green', message: 'Mahsulot o‘chirildi.' });
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
        {!isLoading && (data?.items?.length ?? 0) === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">
            Mahsulotlar topilmadi.
          </Text>
        ) : null}
        {isFetching && !isLoading ? (
          <Text size="xs" c="dimmed" mt="sm">
            Yangilanmoqda...
          </Text>
        ) : null}
      </Paper>

      <Modal
        opened={modalOpen}
        onClose={() => {
          setEditing(null);
          setForm(EMPTY_FORM);
        }}
        title={editing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
        size="xl"
      >
        <Stack>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Nomi"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.currentTarget.value }))}
            />
            <NumberInput
              label="Narx (KRW)"
              min={0}
              value={form.priceKrw}
              onChange={(value) => setForm((prev) => ({ ...prev, priceKrw: Number(value) || 0 }))}
            />
            <Select
              label="Bo‘lim"
              data={categoryOptions}
              value={form.categoryId}
              onChange={(value) => setForm((prev) => ({ ...prev, categoryId: value ?? '' }))}
            />
            <Select
              label="O‘lchov birligi"
              data={unitOptions}
              value={form.measurementUnitId}
              onChange={(value) => setForm((prev) => ({ ...prev, measurementUnitId: value ?? '' }))}
            />
            <NumberInput
              label="Ombor qoldig‘i"
              min={0}
              value={form.stockQuantity}
              onChange={(value) => setForm((prev) => ({ ...prev, stockQuantity: Number(value) || 0 }))}
            />
            <NumberInput
              label="Kam qoldiq chegarasi"
              min={0}
              value={form.lowStockThreshold}
              onChange={(value) => setForm((prev) => ({ ...prev, lowStockThreshold: Number(value) || 0 }))}
            />
            <NumberInput
              label="Eski narx (KRW)"
              min={0}
              value={form.oldPriceKrw}
              onChange={(value) => setForm((prev) => ({ ...prev, oldPriceKrw: Number(value) || 0 }))}
            />
            <NumberInput
              label="Chegirma foizi"
              min={0}
              max={100}
              value={form.discountPercent}
              onChange={(value) => setForm((prev) => ({ ...prev, discountPercent: Number(value) || 0 }))}
            />
          </SimpleGrid>
          <Textarea
            label="Tavsif"
            minRows={3}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.currentTarget.value }))}
          />
          <Textarea
            label="Rasm URL manzillari"
            description="Har qatorda bitta URL; backend ko‘pi bilan 2 ta rasm qabul qiladi."
            minRows={2}
            value={form.imagesText}
            onChange={(e) => setForm((prev) => ({ ...prev, imagesText: e.currentTarget.value }))}
          />
          <FileInput
            label="Rasm faylini yuklash"
            description="JPG, PNG, WebP yoki GIF. Yuklangandan so‘ng URL ro‘yxatga qo‘shiladi."
            placeholder="Rasm tanlang"
            accept="image/png,image/jpeg,image/webp,image/gif"
            leftSection={<IconUpload size={16} />}
            clearable
            disabled={uploadingImage}
            onChange={(file) => void uploadImage(file)}
          />
          <Group>
            <Switch
              label="Faol"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.currentTarget.checked }))}
            />
            <Switch
              label="Chegirma bo‘limi"
              checked={form.isOnSale}
              onChange={(e) => setForm((prev) => ({ ...prev, isOnSale: e.currentTarget.checked }))}
            />
            <Switch
              label="Ko‘p sotilganlar bo‘limi"
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
