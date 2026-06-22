import { Button, Group, NumberInput, Select, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreatePromoCodeMutation, useGetPromoCodesQuery } from '../app/parfumApi';

type PromoKind = 'PERCENT' | 'FIXED' | 'FREE_SHIPPING' | 'FIRST_ORDER';

export function PromotionsPage() {
  const { t } = useTranslation();
  const { data } = useGetPromoCodesQuery();
  const [createPromo, { isLoading: creating }] = useCreatePromoCodeMutation();
  const [code, setCode] = useState('');
  const [kind, setKind] = useState<PromoKind>('PERCENT');
  const [value, setValue] = useState(10);

  const kinds: PromoKind[] = ['PERCENT', 'FIXED', 'FREE_SHIPPING', 'FIRST_ORDER'];

  async function submit() {
    if (!code.trim()) return;
    try {
      await createPromo({ code: code.trim().toUpperCase(), kind, value }).unwrap();
      setCode('');
      setValue(kind === 'PERCENT' ? 10 : 0);
      notifications.show({ color: 'green', title: t('promotions.create'), message: code });
    } catch {
      notifications.show({ color: 'red', title: t('common.error'), message: '' });
    }
  }

  return (
    <Stack>
      <Title order={2}>{t('promotions.title')}</Title>
      <Text size="sm" c="dimmed">
        {t('promotions.subtitle')}
      </Text>
      <Group grow>
        <TextInput
          label={t('promotions.code')}
          value={code}
          onChange={(e) => setCode(e.currentTarget.value)}
        />
        <Select
          label={t('promotions.kind')}
          value={kind}
          onChange={(v) => setKind((v as PromoKind) ?? 'PERCENT')}
          data={kinds.map((k) => ({ value: k, label: t(`promotions.kindOption.${k}`) }))}
        />
        <NumberInput
          label={t('promotions.value')}
          value={value}
          onChange={(v) => setValue(Number(v) || 0)}
        />
      </Group>
      <Button color="parfum" loading={creating} onClick={submit}>
        {t('promotions.create')}
      </Button>
      <Table withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('promotions.code')}</Table.Th>
            <Table.Th>{t('promotions.kind')}</Table.Th>
            <Table.Th>{t('promotions.value')}</Table.Th>
            <Table.Th>{t('promotions.active')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(data ?? []).map((row) => (
            <Table.Tr key={row.id}>
              <Table.Td>{row.code}</Table.Td>
              <Table.Td>{t(`promotions.kindOption.${row.kind}` as const, row.kind)}</Table.Td>
              <Table.Td>{row.value}</Table.Td>
              <Table.Td>{row.isActive ? t('common.active') : t('common.dash')}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
