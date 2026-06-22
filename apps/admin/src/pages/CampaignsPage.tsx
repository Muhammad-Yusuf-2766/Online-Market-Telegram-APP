import { AreaChart } from '@mantine/charts';
import {
  ActionIcon,
  Alert,
  Button,
  Code,
  CopyButton,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useCreateCampaignMutation,
  useGetCampaignLinkHelpQuery,
  useGetCampaignSlugCheckQuery,
  useGetCampaignStatsQuery,
  useGetCampaignsQuery,
} from '../app/parfumApi';
import { formatPrice } from '../shared/lib/money';

function isHttpStatusError(e: unknown, status: number): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'status' in e &&
    (e as { status: unknown }).status === status
  );
}

function normalizeCampaignSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function CampaignsPage() {
  const { t } = useTranslation();
  const { data: campaigns, isLoading, error } = useGetCampaignsQuery();
  const { data: linkHelp } = useGetCampaignLinkHelpQuery();
  const [createCampaign, { isLoading: creating }] = useCreateCampaignMutation();
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [statsSlug, setStatsSlug] = useState<string | null>(null);

  const debouncedSlug = useDebouncedValue(slug, 400)[0];
  const slugForCheck = debouncedSlug.trim();
  const { data: slugCheck, isFetching: slugCheckLoading } = useGetCampaignSlugCheckQuery(
    slugForCheck,
    { skip: slugForCheck.length < 2 },
  );

  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const range = useMemo(() => {
    const to = dayjs().format('YYYY-MM-DD');
    const from = dayjs().subtract(13, 'day').format('YYYY-MM-DD');
    return { from, to };
  }, []);
  const { data: stats, isFetching: statsLoading } = useGetCampaignStatsQuery(
    { slug: statsSlug ?? '', ...range },
    { skip: !statsSlug || !statsModalOpen },
  );

  const chartData = useMemo(() => {
    if (!stats?.series) return [];
    return stats.series.map((row) => ({
      ...row,
      label: dayjs(row.date).format('MMM D'),
    }));
  }, [stats?.series]);

  const slugPending = slug !== debouncedSlug;
  const canSubmit =
    Boolean(name.trim()) &&
    slugCheck?.formatOk === true &&
    slugCheck?.available === true &&
    !creating &&
    !slugCheckLoading &&
    !slugPending;

  const openStatsModal = (s: string) => {
    setStatsSlug(s);
    setStatsModalOpen(true);
  };

  const closeStatsModal = () => {
    setStatsModalOpen(false);
    setStatsSlug(null);
  };

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>{t('campaigns.title')}</Title>
        <Text size="sm" c="dimmed" maw={560}>
          {t('campaigns.subtitle')}
        </Text>
      </div>

      {linkHelp?.envHints?.length ? (
        <Alert color="yellow" title={t('campaigns.envTitle')}>
          <Text size="sm" mb="sm">
            {t('campaigns.envHintSource')}
          </Text>
          {linkHelp.envHints.map((h) => (
            <Text key={h} size="sm">
              {h}
            </Text>
          ))}
        </Alert>
      ) : null}

      {error ? (
        <Alert color="red" title={t('campaigns.loadErrorTitle')}>
          {t('campaigns.loadErrorBody')}
        </Alert>
      ) : null}

      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          <Text fw={600}>{t('campaigns.formTitle')}</Text>
          <TextInput
            label={t('campaigns.slug')}
            description={t('campaigns.slugHint')}
            placeholder={t('campaigns.slugPlaceholder')}
            value={slug}
            onChange={(e) => setSlug(normalizeCampaignSlug(e.target.value))}
            error={
              slugForCheck.length >= 2 &&
              !slugPending &&
              slugCheck &&
              !slugCheck.formatOk
                ? t('campaigns.slugBadFormat')
                : slugForCheck.length >= 2 && !slugPending && slugCheck?.formatOk && !slugCheck.available
                  ? t('campaigns.slugTakenInline')
                  : undefined
            }
          />
          <TextInput
            label={t('campaigns.name')}
            placeholder={t('campaigns.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {slugForCheck.length >= 2 && !slugPending && slugCheckLoading ? (
            <Group gap="xs">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                {t('campaigns.checkingSlug')}
              </Text>
            </Group>
          ) : null}

          {slugForCheck.length >= 2 && !slugPending && slugCheck?.formatOk && slugCheck.available ? (
            <Text size="sm" c="teal.7" fw={500}>
              {t('campaigns.slugAvailable')}
            </Text>
          ) : null}

          {slugForCheck.length >= 2 && !slugPending && slugCheck?.formatOk && slugCheck.previewUrl ? (
            <Stack gap="xs">
              <Text size="sm" fw={600}>
                {t('campaigns.yourLink')}
              </Text>
              <Group gap="sm" align="flex-start" wrap="nowrap">
                <Code block style={{ flex: 1, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                  {slugCheck.previewUrl}
                </Code>
                <CopyButton value={slugCheck.previewUrl} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? t('campaigns.copied') : t('campaigns.copyLink')} withArrow>
                      <ActionIcon
                        variant="filled"
                        color={copied ? 'teal' : 'parfum'}
                        size="lg"
                        onClick={copy}
                        aria-label={t('campaigns.copyLink')}
                      >
                        {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Stack>
          ) : slugForCheck.length >= 2 && !slugPending && slugCheck?.formatOk && !slugCheck.previewUrl ? (
            <Alert color="yellow">{t('campaigns.noPreviewUrl')}</Alert>
          ) : null}

          <Button
            color="parfum"
            loading={creating}
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit || !slugCheck?.formatOk) return;
              const s = slug.trim();
              void createCampaign({ slug: s, name: name.trim() })
                .unwrap()
                .then(() => {
                  notifications.show({
                    color: 'teal',
                    title: t('campaigns.createdTitle'),
                    message: t('campaigns.createdBody'),
                  });
                  setSlug('');
                  setName('');
                })
                .catch((e: unknown) => {
                  if (isHttpStatusError(e, 409)) {
                    notifications.show({
                      color: 'red',
                      title: t('campaigns.slugTakenTitle'),
                      message: t('campaigns.slugTakenBody'),
                    });
                    return;
                  }
                  notifications.show({
                    color: 'red',
                    title: t('campaigns.loadErrorTitle'),
                    message: t('campaigns.loadErrorBody'),
                  });
                });
            }}
          >
            {t('campaigns.create')}
          </Button>
        </Stack>
      </Paper>

      {isLoading ? (
        <Loader />
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('campaigns.colSlug')}</Table.Th>
              <Table.Th>{t('campaigns.colName')}</Table.Th>
              <Table.Th>{t('campaigns.colUsers')}</Table.Th>
              <Table.Th>{t('campaigns.colOrders')}</Table.Th>
              <Table.Th>{t('campaigns.colRevenue')}</Table.Th>
              <Table.Th>{t('campaigns.colLink')}</Table.Th>
              <Table.Th>{t('campaigns.colActions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(campaigns ?? []).map((c) => (
              <Table.Tr key={c.id}>
                <Table.Td>
                  <Code>{c.slug}</Code>
                </Table.Td>
                <Table.Td>{c.name}</Table.Td>
                <Table.Td>{c.attributedUsers}</Table.Td>
                <Table.Td>{c.attributedOrders}</Table.Td>
                <Table.Td>{formatPrice(c.attributedRevenueUzs)}</Table.Td>
                <Table.Td>
                  {c.miniAppUrl ? (
                    <CopyButton value={c.miniAppUrl} timeout={2000}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? t('campaigns.copied') : t('campaigns.copyLink')}>
                          <Button size="xs" variant="light" leftSection={<IconCopy size={14} />} onClick={copy}>
                            {copied ? t('campaigns.copied') : t('campaigns.copyLink')}
                          </Button>
                        </Tooltip>
                      )}
                    </CopyButton>
                  ) : (
                    <Text size="xs" c="dimmed">
                      —
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => {
                      openStatsModal(c.slug);
                    }}
                  >
                    {t('campaigns.stats')}
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={statsModalOpen} onClose={closeStatsModal} title={t('campaigns.statsTitle')} size="lg">
        {statsLoading || !stats ? (
          <Loader />
        ) : (
          <Stack gap="md">
            <Text size="sm">
              {t('campaigns.totalAttributed')}: {stats.totalAttributedUsers} · {t('campaigns.signupsInRange')}:{' '}
              {stats.signupsInRange}
            </Text>
            <Text size="sm">
              {t('campaigns.attributedOrders')}: {stats.attributedOrders} · {t('campaigns.attributedRevenue')}:{' '}
              {formatPrice(stats.attributedRevenueUzs)} · {t('campaigns.firstOrderConversionRate')}:{' '}
              {(stats.firstOrderConversionRate * 100).toFixed(1)}%
            </Text>
            {stats.sampleUrl ? (
              <Group gap="sm" align="flex-start" wrap="nowrap">
                <Code block style={{ flex: 1, wordBreak: 'break-all' }}>
                  {stats.sampleUrl}
                </Code>
                <CopyButton value={stats.sampleUrl} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? t('campaigns.copied') : t('campaigns.copyLink')}>
                      <ActionIcon
                        variant="filled"
                        color={copied ? 'teal' : 'parfum'}
                        onClick={copy}
                        aria-label={t('campaigns.copyLink')}
                      >
                        {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            ) : null}
            <AreaChart
              h={220}
              data={chartData}
              dataKey="label"
              series={[{ name: 'signups', color: 'parfum.6', label: t('campaigns.signups') }]}
              curveType="monotone"
              withDots={false}
            />
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
