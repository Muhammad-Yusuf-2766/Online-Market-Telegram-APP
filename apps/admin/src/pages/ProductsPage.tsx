import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Checkbox,
  Divider,
  Drawer,
  FileButton,
  Group,
  Image,
  Loader,
  Modal,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Switch,
  Table,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter, IconPencil, IconPlus, IconTrash, IconUpload } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type Product,
  type ProductGender,
  type ProductListFilters,
  type ProductWritePayload,
  type SizePreset,
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetBrandsQuery,
  useGetCategoriesQuery,
  useGetFragranceFamiliesQuery,
  useGetProductsQuery,
  useGetSizePresetsQuery,
  usePresignUploadMutation,
  useUpdateProductMutation,
} from '../app/parfumApi';
import { formatPrice } from '../shared/lib/money';
import { useListSearchParams } from '../shared/lib/useListSearchParams';
import { paginationFromTotal } from '../shared/lib/serverPagination';
import { TablePaginationFooter } from '../shared/ui/TablePaginationFooter';

function parseImageList(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatProductPriceColumn(p: Product): string {
  if (p.sizes && p.sizes.length > 0) {
    const prices = p.sizes.map((s) => s.priceUzs);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) {
      return formatPrice(min);
    }
    return `${formatPrice(min)} – ${formatPrice(max)}`;
  }
  return formatPrice(p.priceUzs);
}

function variantCountLabel(p: Product, dash: string): string {
  const n = p.sizes?.length ?? 0;
  return n > 0 ? String(n) : dash;
}

function coerceSizeNumber(v: string | number | undefined): number | '' {
  if (v === '' || v === undefined) return '';
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : '';
}

function numberOrNull(v: number | string | ''): number | null {
  if (v === '' || v === undefined) return null;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

type FormValues = {
  title: string;
  description: string;
  priceUzs: number;
  sizes: Array<{ presetId: string; priceUzs: number }>;
  images: string[];
  stockGrams: number | null;
  lowStockGramsThreshold: number | null;
  categoryId: string | null;
  brandId: string | null;
  familyId: string | null;
  gender: ProductGender;
  notesTop: string[];
  notesHeart: string[];
  notesBase: string[];
  isBestseller: boolean;
  isNewArrival: boolean;
  releaseYear: number | null;
  oldPriceUzs: number | null;
  discountPercent: number | null;
  lowStockThreshold: number | null;
};

function ProductFormFields({
  presets,
  initial,
  onCancel,
  onSubmit,
  submitting,
}: {
  presets: SizePreset[];
  initial: Product | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: FormValues) => void;
}) {
  const { t } = useTranslation();
  const { data: brands } = useGetBrandsQuery();
  const { data: categories } = useGetCategoriesQuery();
  const { data: families } = useGetFragranceFamiliesQuery();
  const [presignUpload] = usePresignUploadMutation();

  const [formTitle, setFormTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [priceUzs, setPriceUzs] = useState<number | string>(initial?.priceUzs ?? '');
  const [imagesRaw, setImagesRaw] = useState((initial?.images ?? []).join('\n'));
  const [included, setIncluded] = useState<Record<string, boolean>>({});
  const [priceByPreset, setPriceByPreset] = useState<Record<string, number | ''>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const [brandId, setBrandId] = useState<string | null>(initial?.brandId ?? null);
  const [familyId, setFamilyId] = useState<string | null>(initial?.familyId ?? null);
  const [gender, setGender] = useState<ProductGender>(initial?.gender ?? 'UNISEX');
  const [notesTop, setNotesTop] = useState<string[]>(initial?.notesTop ?? []);
  const [notesHeart, setNotesHeart] = useState<string[]>(initial?.notesHeart ?? []);
  const [notesBase, setNotesBase] = useState<string[]>(initial?.notesBase ?? []);
  const [isBestseller, setIsBestseller] = useState<boolean>(initial?.isBestseller ?? false);
  const [isNewArrival, setIsNewArrival] = useState<boolean>(initial?.isNewArrival ?? false);
  const [releaseYear, setReleaseYear] = useState<number | string>(initial?.releaseYear ?? '');
  const [oldPriceUzs, setOldPriceUzs] = useState<number | string>(initial?.oldPriceUzs ?? '');
  const [discountPercent, setDiscountPercent] = useState<number | string>(initial?.discountPercent ?? '');
  const [lowStockThreshold, setLowStockThreshold] = useState<number | string>(
    initial?.lowStockThreshold ?? '',
  );
  const [stockGrams, setStockGrams] = useState<number | string>(initial?.stockGrams ?? '');
  const [lowStockGramsThreshold, setLowStockGramsThreshold] = useState<number | string>(
    initial?.lowStockGramsThreshold ?? '',
  );

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const presetIdsKey = useMemo(() => presets.map((p) => p.id).join(','), [presets]);

  useEffect(() => {
    setFormTitle(initial?.title ?? '');
    setDescription(initial?.description ?? '');
    setPriceUzs(initial?.priceUzs ?? '');
    setImagesRaw((initial?.images ?? []).join('\n'));
    setFormError(null);
    setUploadError(null);

    setCategoryId(initial?.categoryId ?? null);
    setBrandId(initial?.brandId ?? null);
    setFamilyId(initial?.familyId ?? null);
    setGender(initial?.gender ?? 'UNISEX');
    setNotesTop(initial?.notesTop ?? []);
    setNotesHeart(initial?.notesHeart ?? []);
    setNotesBase(initial?.notesBase ?? []);
    setIsBestseller(initial?.isBestseller ?? false);
    setIsNewArrival(initial?.isNewArrival ?? false);
    setReleaseYear(initial?.releaseYear ?? '');
    setOldPriceUzs(initial?.oldPriceUzs ?? '');
    setDiscountPercent(initial?.discountPercent ?? '');
    setLowStockThreshold(initial?.lowStockThreshold ?? '');
    setStockGrams(initial?.stockGrams ?? '');
    setLowStockGramsThreshold(initial?.lowStockGramsThreshold ?? '');

    const inc: Record<string, boolean> = {};
    const pr: Record<string, number | ''> = {};
    for (const p of presets) {
      inc[p.id] = false;
      pr[p.id] = '';
    }
    if (initial?.sizes?.length) {
      for (const s of initial.sizes) {
        inc[s.presetId] = true;
        pr[s.presetId] = s.priceUzs;
      }
    }
    setIncluded(inc);
    setPriceByPreset(pr);
  }, [initial, presetIdsKey, presets]);

  const brandOptions = useMemo(
    () => (brands ?? []).map((b) => ({ value: b.id, label: b.name })),
    [brands],
  );
  const categoryOptions = useMemo(
    () => (categories ?? []).map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );
  const familyOptions = useMemo(
    () => (families ?? []).map((f) => ({ value: f.id, label: f.name })),
    [families],
  );

  const uploadedImages = useMemo(() => parseImageList(imagesRaw), [imagesRaw]);

  async function handleFileUpload(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError(t('products.uploadFailed'));
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const presigned = await presignUpload({
        contentType: file.type,
        keyPrefix: 'products/',
      }).unwrap();
      const putRes = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putRes.ok) {
        throw new Error(`Upload failed: ${putRes.status}`);
      }
      setImagesRaw((prev) =>
        prev.trim().length > 0 ? `${prev.trim()}\n${presigned.publicUrl}` : presigned.publicUrl,
      );
    } catch (err) {
      console.error(err);
      setUploadError(t('products.uploadFailed'));
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setImagesRaw((prev) =>
      parseImageList(prev)
        .filter((u) => u !== url)
        .join('\n'),
    );
  }

  return (
    <Stack gap="md">
      <TextInput
        label={t('products.formTitle')}
        value={formTitle}
        onChange={(e) => setFormTitle(e.currentTarget.value)}
        required
      />
      <Textarea
        label={t('products.formDescription')}
        value={description}
        onChange={(e) => setDescription(e.currentTarget.value)}
        minRows={3}
      />

      <Divider label={t('products.taxonomySection')} labelPosition="center" />
      <Group grow align="flex-start">
        <Select
          label={t('products.fieldBrand')}
          data={brandOptions}
          value={brandId}
          onChange={setBrandId}
          searchable
          clearable
          nothingFoundMessage={t('products.noneOption')}
        />
        <Select
          label={t('products.fieldCategory')}
          data={categoryOptions}
          value={categoryId}
          onChange={setCategoryId}
          searchable
          clearable
          nothingFoundMessage={t('products.noneOption')}
        />
      </Group>
      <Group grow align="flex-start">
        <Select
          label={t('products.fieldFamily')}
          data={familyOptions}
          value={familyId}
          onChange={setFamilyId}
          searchable
          clearable
          nothingFoundMessage={t('products.noneOption')}
        />
        <Select
          label={t('products.fieldGender')}
          data={[
            { value: 'UNISEX', label: t('products.genderUnisex') },
            { value: 'MEN', label: t('products.genderMen') },
            { value: 'WOMEN', label: t('products.genderWomen') },
          ]}
          value={gender}
          onChange={(v) => setGender((v as ProductGender) ?? 'UNISEX')}
          allowDeselect={false}
        />
      </Group>

      <Divider label={t('products.sizesSection')} labelPosition="center" />
      <Text size="sm" c="dimmed">
        {t('products.sizesFromPresetsHint')}
      </Text>
      {presets.length === 0 ? (
        <Text size="sm" c="orange">
          {t('products.noPresetsWarning')}
        </Text>
      ) : (
        <Table withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={48} />
              <Table.Th>{t('products.sizeLabelCol')}</Table.Th>
              <Table.Th>{t('products.sizeGrams')}</Table.Th>
              <Table.Th miw={160}>{t('products.priceUzs')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {presets.map((preset) => (
              <Table.Tr key={preset.id}>
                <Table.Td>
                  <Checkbox
                    checked={included[preset.id] ?? false}
                    onChange={(e) => {
                      const next = e.currentTarget.checked;
                      setIncluded((prev) => ({
                        ...prev,
                        [preset.id]: next,
                      }));
                    }}
                  />
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {preset.label}{' '}
                    <Text span size="xs" c="dimmed">
                      ({preset.slug})
                    </Text>
                  </Text>
                </Table.Td>
                <Table.Td>{preset.grams}</Table.Td>
                <Table.Td>
                  <NumberInput
                    size="xs"
                    disabled={!included[preset.id]}
                    value={priceByPreset[preset.id] ?? ''}
                    onChange={(v) =>
                      setPriceByPreset((prev) => ({
                        ...prev,
                        [preset.id]: coerceSizeNumber(v),
                      }))
                    }
                    min={0}
                    allowDecimal={false}
                    thousandSeparator=" "
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
      <NumberInput
        label={t('products.formPrice')}
        description={t('products.formPriceHintUzs')}
        value={priceUzs}
        onChange={(v) => setPriceUzs(v)}
        min={0}
        allowDecimal={false}
        thousandSeparator=" "
      />

      <Divider label={t('products.uploadSection')} labelPosition="center" />
      <Text size="sm" c="dimmed">
        {t('products.uploadHint')}
      </Text>
      <Group align="center">
        <FileButton onChange={handleFileUpload} accept="image/png,image/jpeg,image/webp,image/gif">
          {(props) => (
            <Button
              {...props}
              leftSection={<IconUpload size={16} />}
              variant="light"
              loading={uploading}
            >
              {t('products.uploadButton')}
            </Button>
          )}
        </FileButton>
        {uploading ? (
          <Text size="sm" c="dimmed">
            {t('products.uploadingHint')}
          </Text>
        ) : null}
        {uploadError ? (
          <Text size="sm" c="red">
            {uploadError}
          </Text>
        ) : null}
      </Group>

      {uploadedImages.length > 0 ? (
        <Group gap="xs" wrap="wrap">
          {uploadedImages.map((url) => (
            <Stack key={url} gap={4} align="center" w={96}>
              <Image src={url} alt="" h={88} w={88} radius="sm" fit="cover" />
              <Button
                size="compact-xs"
                variant="subtle"
                color="red"
                onClick={() => removeImage(url)}
              >
                {t('products.removeImage')}
              </Button>
            </Stack>
          ))}
        </Group>
      ) : null}

      <Textarea
        label={t('products.formImages')}
        description={t('products.formImagesHint')}
        value={imagesRaw}
        onChange={(e) => setImagesRaw(e.currentTarget.value)}
        minRows={2}
      />

      <Divider label={t('products.merchSection')} labelPosition="center" />
      <Group grow align="flex-start">
        <Switch
          label={t('products.fieldBestseller')}
          checked={isBestseller}
          onChange={(e) => setIsBestseller(e.currentTarget.checked)}
        />
        <Switch
          label={t('products.fieldNewArrival')}
          checked={isNewArrival}
          onChange={(e) => setIsNewArrival(e.currentTarget.checked)}
        />
      </Group>
      <Group grow align="flex-start">
        <NumberInput
          label={t('products.fieldOldPrice')}
          value={oldPriceUzs}
          onChange={(v) => setOldPriceUzs(v === '' ? '' : Number(v))}
          min={0}
          allowDecimal={false}
          thousandSeparator=" "
        />
        <NumberInput
          label={t('products.fieldDiscountPercent')}
          value={discountPercent}
          onChange={(v) => setDiscountPercent(v === '' ? '' : Number(v))}
          min={0}
          max={100}
          allowDecimal={false}
        />
      </Group>
      <Group grow align="flex-start">
        <NumberInput
          label={t('products.fieldReleaseYear')}
          value={releaseYear}
          onChange={(v) => setReleaseYear(v === '' ? '' : Number(v))}
          min={1900}
          max={3000}
          allowDecimal={false}
        />
        <NumberInput
          label={t('products.fieldLowStock')}
          value={lowStockThreshold}
          onChange={(v) => setLowStockThreshold(v === '' ? '' : Number(v))}
          min={0}
          allowDecimal={false}
        />
      </Group>
      <Group grow align="flex-start">
        <NumberInput
          label={t('products.fieldStockGrams')}
          description={t('products.fieldStockGramsHint')}
          value={stockGrams}
          onChange={(v) => setStockGrams(v === '' ? '' : Number(v))}
          min={0}
          allowDecimal={false}
          thousandSeparator=" "
        />
        <NumberInput
          label={t('products.fieldLowStockGrams')}
          value={lowStockGramsThreshold}
          onChange={(v) => setLowStockGramsThreshold(v === '' ? '' : Number(v))}
          min={0}
          allowDecimal={false}
        />
      </Group>

      <Divider label={t('products.notesSection')} labelPosition="center" />
      <TagsInput
        label={t('products.fieldNotesTop')}
        placeholder={t('products.notesHint')}
        value={notesTop}
        onChange={setNotesTop}
      />
      <TagsInput
        label={t('products.fieldNotesHeart')}
        placeholder={t('products.notesHint')}
        value={notesHeart}
        onChange={setNotesHeart}
      />
      <TagsInput
        label={t('products.fieldNotesBase')}
        placeholder={t('products.notesHint')}
        value={notesBase}
        onChange={setNotesBase}
      />

      {formError ? (
        <Text size="sm" c="red">
          {formError}
        </Text>
      ) : null}
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button
          color="parfum"
          loading={submitting}
          onClick={() => {
            setFormError(null);
            if (!formTitle.trim()) return;

            const lines: Array<{ presetId: string; priceUzs: number }> = [];
            for (const preset of presets) {
              if (!included[preset.id]) continue;
              const raw = priceByPreset[preset.id];
              const pu =
                typeof raw === 'number' ? raw : raw === '' ? NaN : Number(raw);
              if (!Number.isFinite(pu) || pu < 0) {
                setFormError(t('products.priceRequiredForSelectedSizes'));
                return;
              }
              lines.push({ presetId: preset.id, priceUzs: Math.round(pu) });
            }

            const pcBase =
              typeof priceUzs === 'number' ? priceUzs : Number(priceUzs);
            if (lines.length === 0) {
              if (Number.isNaN(pcBase) || pcBase < 0) return;
            }
            const listing =
              lines.length > 0 ? Math.min(...lines.map((l) => l.priceUzs)) : pcBase;

            onSubmit({
              title: formTitle.trim(),
              description,
              priceUzs: listing,
              sizes: lines,
              images: parseImageList(imagesRaw),
              stockGrams: numberOrNull(stockGrams),
              lowStockGramsThreshold: numberOrNull(lowStockGramsThreshold),
              categoryId,
              brandId,
              familyId,
              gender,
              notesTop,
              notesHeart,
              notesBase,
              isBestseller,
              isNewArrival,
              releaseYear: numberOrNull(releaseYear),
              oldPriceUzs: numberOrNull(oldPriceUzs),
              discountPercent: numberOrNull(discountPercent),
              lowStockThreshold: numberOrNull(lowStockThreshold),
            });
          }}
        >
          {t('common.save')}
        </Button>
      </Group>
    </Stack>
  );
}

function buildCreatePayload(values: FormValues): ProductWritePayload {
  return {
    title: values.title,
    description: values.description || undefined,
    priceUzs: values.priceUzs,
    ...(values.sizes.length > 0 ? { sizes: values.sizes } : {}),
    images: values.images.length ? values.images : undefined,
    ...(values.stockGrams !== null ? { stockGrams: values.stockGrams } : {}),
    ...(values.lowStockGramsThreshold !== null
      ? { lowStockGramsThreshold: values.lowStockGramsThreshold }
      : {}),
    categoryId: values.categoryId ?? undefined,
    brandId: values.brandId ?? undefined,
    familyId: values.familyId ?? undefined,
    gender: values.gender,
    notesTop: values.notesTop,
    notesHeart: values.notesHeart,
    notesBase: values.notesBase,
    isBestseller: values.isBestseller,
    isNewArrival: values.isNewArrival,
    ...(values.releaseYear !== null ? { releaseYear: values.releaseYear } : {}),
    ...(values.oldPriceUzs !== null ? { oldPriceUzs: values.oldPriceUzs } : {}),
    ...(values.discountPercent !== null ? { discountPercent: values.discountPercent } : {}),
    ...(values.lowStockThreshold !== null
      ? { lowStockThreshold: values.lowStockThreshold }
      : {}),
  };
}

function buildUpdatePayload(values: FormValues): Partial<ProductWritePayload> {
  return {
    title: values.title,
    description: values.description,
    priceUzs: values.priceUzs,
    sizes: values.sizes.length > 0 ? values.sizes : [],
    images: values.images,
    stockGrams: values.stockGrams,
    lowStockGramsThreshold: values.lowStockGramsThreshold,
    categoryId: values.categoryId,
    brandId: values.brandId,
    familyId: values.familyId,
    gender: values.gender,
    notesTop: values.notesTop,
    notesHeart: values.notesHeart,
    notesBase: values.notesBase,
    isBestseller: values.isBestseller,
    isNewArrival: values.isNewArrival,
    releaseYear: values.releaseYear,
    oldPriceUzs: values.oldPriceUzs,
    discountPercent: values.discountPercent,
    lowStockThreshold: values.lowStockThreshold,
  };
}

type SortKey = NonNullable<ProductListFilters['sort']>;

const SORT_OPTIONS_KEYS: Array<{ value: SortKey; key: string }> = [
  { value: 'newest', key: 'sortNewest' },
  { value: 'price_asc', key: 'sortPriceAsc' },
  { value: 'price_desc', key: 'sortPriceDesc' },
  { value: 'title_asc', key: 'sortTitleAsc' },
  { value: 'title_desc', key: 'sortTitleDesc' },
  { value: 'rating_desc', key: 'sortRatingDesc' },
  { value: 'bestselling', key: 'sortBestselling' },
];

export function ProductsPage() {
  const { t } = useTranslation();
  const { page, setPage, pageSize, setPageSize } = useListSearchParams(25);

  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<ProductListFilters>({});

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.brandIds?.length) n += 1;
    if (filters.categoryIds?.length) n += 1;
    if (filters.familyIds?.length) n += 1;
    if (filters.gender) n += 1;
    if (filters.priceMin !== undefined) n += 1;
    if (filters.priceMax !== undefined) n += 1;
    if (filters.bestseller) n += 1;
    if (filters.newArrival) n += 1;
    if (filters.discounted) n += 1;
    if (filters.inStockOnly) n += 1;
    if (filters.sort && filters.sort !== 'newest') n += 1;
    return n;
  }, [filters]);

  const { data, isLoading, error } = useGetProductsQuery({
    page,
    pageSize,
    ...(q ? { q } : {}),
    ...filters,
  });
  const { data: presetsData } = useGetSizePresetsQuery({ page: 1, pageSize: 100 });
  const { data: brands } = useGetBrandsQuery();
  const { data: categories } = useGetCategoriesQuery();
  const { data: families } = useGetFragranceFamiliesQuery();
  const presetList = presetsData?.items ?? [];

  const [createOpen, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [filtersOpen, { open: openFilters, close: closeFilters }] = useDisclosure(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [draftFilters, setDraftFilters] = useState<ProductListFilters>({});

  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [removeProduct, { isLoading: removing }] = useDeleteProductMutation();

  const total = data?.total ?? 0;
  const { totalPages, rangeStart, rangeEnd, effectivePage } = paginationFromTotal(
    total,
    page,
    pageSize,
  );

  useEffect(() => {
    if (page !== effectivePage) setPage(effectivePage);
  }, [page, effectivePage, setPage]);

  useEffect(() => {
    setPage(1);
  }, [q, filters, setPage]);

  const rows = (data?.items ?? []).map((p) => (
    <Table.Tr key={p.id}>
      <Table.Td w={72}>
        {p.images[0] ? (
          <Image
            src={p.images[0]}
            alt=""
            h={48}
            w={48}
            radius="sm"
            fit="cover"
            fallbackSrc="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          />
        ) : (
          <Text size="xs" c="dimmed">
            —
          </Text>
        )}
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Text fw={500}>{p.title}</Text>
          {p.isBestseller ? <Badge size="xs" color="yellow">B</Badge> : null}
          {p.isNewArrival ? <Badge size="xs" color="teal">N</Badge> : null}
          {p.discountPercent ? <Badge size="xs" color="red">-{p.discountPercent}%</Badge> : null}
        </Group>
        <Text size="xs" c="dimmed" lineClamp={2}>
          {p.description || '—'}
        </Text>
      </Table.Td>
      <Table.Td>{formatProductPriceColumn(p)}</Table.Td>
      <Table.Td>{variantCountLabel(p, t('common.dash'))}</Table.Td>
      <Table.Td>{p.stockGrams != null ? `${p.stockGrams.toLocaleString('ru-RU')} g` : '—'}</Table.Td>
      <Table.Td>
        <Group gap={4}>
          <ActionIcon
            variant="subtle"
            color="parfum"
            onClick={() => setEditing(p)}
            aria-label={t('products.editAria')}
          >
            <IconPencil size={18} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => setDeleting(p)}
            aria-label={t('products.deleteAria')}
          >
            <IconTrash size={18} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  const brandOptions = useMemo(
    () => (brands ?? []).map((b) => ({ value: b.id, label: b.name })),
    [brands],
  );
  const categoryOptions = useMemo(
    () => (categories ?? []).map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );
  const familyOptions = useMemo(
    () => (families ?? []).map((f) => ({ value: f.id, label: f.name })),
    [families],
  );

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap">
        <Title order={2}>{t('products.title')}</Title>
        <Group gap="sm">
          <Button
            leftSection={<IconFilter size={18} />}
            variant="light"
            onClick={() => {
              setDraftFilters(filters);
              openFilters();
            }}
          >
            {t('products.filtersOpen')}
            {activeFilterCount > 0 ? (
              <Badge ml={6} size="sm" color="parfum">
                {activeFilterCount}
              </Badge>
            ) : null}
          </Button>
          <Button leftSection={<IconPlus size={18} />} color="parfum" onClick={openCreate}>
            {t('products.addProduct')}
          </Button>
        </Group>
      </Group>

      <Group align="flex-end" gap="sm" wrap="wrap">
        <TextInput
          label={t('products.search')}
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          w={{ base: '100%', sm: 360 }}
        />
        <Select
          label={t('products.filterSort')}
          value={filters.sort ?? 'newest'}
          onChange={(v) =>
            setFilters((prev) => ({ ...prev, sort: (v as SortKey) ?? undefined }))
          }
          data={SORT_OPTIONS_KEYS.map((s) => ({ value: s.value, label: t(`products.${s.key}` as const) }))}
          w={220}
        />
      </Group>

      {error ? (
        <Alert color="red" title={t('products.loadErrorTitle')}>
          {t('products.loadErrorBody')}
        </Alert>
      ) : null}

      {isLoading ? (
        <Loader />
      ) : (
        <>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('products.colThumb')}</Table.Th>
                <Table.Th>{t('products.colProduct')}</Table.Th>
                <Table.Th>{t('products.colPrice')}</Table.Th>
                <Table.Th>{t('products.colVariants')}</Table.Th>
                <Table.Th>{t('products.colStockGrams')}</Table.Th>
                <Table.Th w={120}>{t('products.colActions')}</Table.Th>
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

      <Modal opened={createOpen} onClose={closeCreate} title={t('products.modalNew')} size="xl">
        <ProductFormFields
          key={createOpen ? 'create' : 'idle'}
          presets={presetList}
          initial={null}
          submitting={creating}
          onCancel={closeCreate}
          onSubmit={async (values) => {
            await createProduct(buildCreatePayload(values)).unwrap();
            closeCreate();
          }}
        />
      </Modal>

      <Modal opened={editing !== null} onClose={() => setEditing(null)} title={t('products.modalEdit')} size="xl">
        {editing ? (
          <ProductFormFields
            presets={presetList}
            initial={editing}
            submitting={updating}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await updateProduct({
                id: editing.id,
                body: buildUpdatePayload(values),
              }).unwrap();
              setEditing(null);
            }}
          />
        ) : null}
      </Modal>

      <Modal opened={deleting !== null} onClose={() => setDeleting(null)} title={t('products.modalDelete')}>
        <Text size="sm">{t('products.deleteConfirm', { title: deleting?.title ?? '' })}</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setDeleting(null)}>
            {t('common.cancel')}
          </Button>
          <Button
            color="red"
            loading={removing}
            onClick={async () => {
              if (!deleting) return;
              await removeProduct(deleting.id).unwrap();
              setDeleting(null);
            }}
          >
            {t('common.delete')}
          </Button>
        </Group>
      </Modal>

      <Drawer
        opened={filtersOpen}
        onClose={closeFilters}
        title={t('products.filtersTitle')}
        position="right"
        size="md"
      >
        <Stack gap="md">
          <MultiSelect
            label={t('products.filterBrand')}
            data={brandOptions}
            value={draftFilters.brandIds ?? []}
            onChange={(v) => setDraftFilters((prev) => ({ ...prev, brandIds: v }))}
            searchable
            clearable
          />
          <MultiSelect
            label={t('products.filterCategory')}
            data={categoryOptions}
            value={draftFilters.categoryIds ?? []}
            onChange={(v) => setDraftFilters((prev) => ({ ...prev, categoryIds: v }))}
            searchable
            clearable
          />
          <MultiSelect
            label={t('products.filterFamily')}
            data={familyOptions}
            value={draftFilters.familyIds ?? []}
            onChange={(v) => setDraftFilters((prev) => ({ ...prev, familyIds: v }))}
            searchable
            clearable
          />
          <Select
            label={t('products.filterGender')}
            data={[
              { value: '', label: t('products.noneOption') },
              { value: 'UNISEX', label: t('products.genderUnisex') },
              { value: 'MEN', label: t('products.genderMen') },
              { value: 'WOMEN', label: t('products.genderWomen') },
            ]}
            value={draftFilters.gender ?? ''}
            onChange={(v) =>
              setDraftFilters((prev) => ({
                ...prev,
                gender: (v as ProductGender | '') ? (v as ProductGender) : undefined,
              }))
            }
            clearable
          />
          <Group grow>
            <NumberInput
              label={t('products.filterPriceMin')}
              value={draftFilters.priceMin ?? ''}
              onChange={(v) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  priceMin: v === '' ? undefined : Number(v),
                }))
              }
              min={0}
              allowDecimal={false}
              thousandSeparator=" "
            />
            <NumberInput
              label={t('products.filterPriceMax')}
              value={draftFilters.priceMax ?? ''}
              onChange={(v) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  priceMax: v === '' ? undefined : Number(v),
                }))
              }
              min={0}
              allowDecimal={false}
              thousandSeparator=" "
            />
          </Group>
          <Switch
            label={t('products.filterBestseller')}
            checked={Boolean(draftFilters.bestseller)}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, bestseller: e.currentTarget.checked }))}
          />
          <Switch
            label={t('products.filterNewArrival')}
            checked={Boolean(draftFilters.newArrival)}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, newArrival: e.currentTarget.checked }))}
          />
          <Switch
            label={t('products.filterDiscounted')}
            checked={Boolean(draftFilters.discounted)}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, discounted: e.currentTarget.checked }))}
          />
          <Switch
            label={t('products.filterInStock')}
            checked={Boolean(draftFilters.inStockOnly)}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, inStockOnly: e.currentTarget.checked }))}
          />
          <Group justify="space-between" mt="md">
            <Button
              variant="subtle"
              onClick={() => {
                setDraftFilters({});
                setFilters({});
                closeFilters();
              }}
            >
              {t('products.filtersReset')}
            </Button>
            <Button
              color="parfum"
              onClick={() => {
                setFilters(draftFilters);
                closeFilters();
              }}
            >
              {t('products.filtersApply')}
            </Button>
          </Group>
        </Stack>
      </Drawer>
    </Stack>
  );
}
