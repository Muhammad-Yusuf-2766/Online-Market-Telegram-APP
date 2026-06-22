import {
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  PasswordInput,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  type TelegramUser,
  type UserTier,
  useAdjustUserCoinsMutation,
  useGetUserReferralTreeQuery,
  useGetUsersQuery,
  useGiftUserCoinsMutation,
} from '../app/parfumApi';
import { AdminReferralTree } from '../features/referral-tree/AdminReferralTree';
import { useListSearchParams } from '../shared/lib/useListSearchParams';
import { paginationFromTotal } from '../shared/lib/serverPagination';
import { TablePaginationFooter } from '../shared/ui/TablePaginationFooter';
import { UserTierBadge } from '../shared/ui/UserTierBadge';
import { formatPrice } from '../shared/lib/money';

const TIER_VALUES: UserTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

export function UsersPage() {
  const { t } = useTranslation();
  const { page, setPage, pageSize, setPageSize } = useListSearchParams(25);
  const [q, setQ] = useState('');
  const [tier, setTier] = useState<UserTier | null>(null);

  const { data, isLoading, error } = useGetUsersQuery({
    page,
    pageSize,
    ...(q ? { q } : {}),
    ...(tier ? { tier } : {}),
  });
  const [giftUser] = useGiftUserCoinsMutation();
  const [adjustCoins] = useAdjustUserCoinsMutation();

  const [giftOpen, setGiftOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<TelegramUser | null>(null);
  const [treeUser, setTreeUser] = useState<TelegramUser | null>(null);
  const treeMaxDepth = 5;
  const {
    data: referralRoot,
    isLoading: treeLoading,
    isError: treeError,
  } = useGetUserReferralTreeQuery(
    { userId: treeUser?.id ?? '', maxDepth: treeMaxDepth },
    { skip: !treeUser?.id || !treeOpen },
  );

  const [giftTitle, setGiftTitle] = useState('');
  const [giftDescription, setGiftDescription] = useState('');
  const [giftImageUrl, setGiftImageUrl] = useState('');
  const [giftCoins, setGiftCoins] = useState(1);

  const [adjPassword, setAdjPassword] = useState('');
  const [adjDelta, setAdjDelta] = useState(0);
  const [adjNote, setAdjNote] = useState('');

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
  }, [q, tier, setPage]);

  const rows = (data?.items ?? []).map((u) => (
    <Table.Tr key={u.id}>
      <Table.Td>
        <Text size="sm" ff="monospace">
          {u.telegramId}
        </Text>
      </Table.Td>
      <Table.Td>{u.telegramUsername ?? '—'}</Table.Td>
      <Table.Td>{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</Table.Td>
      <Table.Td>
        <UserTierBadge tier={u.tier} />
      </Table.Td>
      <Table.Td>{formatPrice(u.coinBalance)}</Table.Td>
      <Table.Td>{u.phone ?? '—'}</Table.Td>
      <Table.Td>{dayjs(u.createdAt).format('YYYY-MM-DD')}</Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Button
            size="xs"
            variant="light"
            onClick={() => {
              setActiveUser(u);
              setGiftTitle('');
              setGiftDescription('');
              setGiftImageUrl('');
              setGiftCoins(1);
              setGiftOpen(true);
            }}
          >
            {t('users.gift')}
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              setActiveUser(u);
              setAdjPassword('');
              setAdjDelta(0);
              setAdjNote('');
              setAdjustOpen(true);
            }}
          >
            {t('users.adjust')}
          </Button>
          <Button
            size="xs"
            variant="light"
            color="teal"
            onClick={() => {
              setTreeUser(u);
              setTreeOpen(true);
            }}
          >
            {t('users.referralTree')}
          </Button>
          <Button component={Link} to={`/users/${u.id}`} size="xs" variant="subtle">
            {t('users.viewProfile')}
          </Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="md">
      <Title order={2}>{t('users.title')}</Title>
      <Text size="sm" c="dimmed">
        {t('users.subtitle')}
      </Text>

      <Group align="flex-end" gap="sm" wrap="wrap">
        <TextInput
          label={t('users.search')}
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          w={{ base: '100%', sm: 360 }}
        />
        <Select
          label={t('users.filterTier')}
          value={tier}
          onChange={(v) => setTier((v as UserTier | null) ?? null)}
          data={[
            { value: '', label: t('users.filterAllTiers') },
            ...TIER_VALUES.map((v) => ({
              value: v,
              label: t(`userTier.${v}` as const, v),
            })),
          ]}
          clearable
          w={200}
        />
        {q || tier ? (
          <Button
            variant="subtle"
            onClick={() => {
              setQ('');
              setTier(null);
            }}
          >
            {t('users.clearFilters')}
          </Button>
        ) : null}
      </Group>

      {error ? (
        <Alert color="red" title={t('users.loadErrorTitle')}>
          {t('users.loadErrorBody')}
        </Alert>
      ) : null}

      {isLoading ? (
        <Loader />
      ) : (
        <>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('users.colTelegramId')}</Table.Th>
                <Table.Th>{t('users.colUsername')}</Table.Th>
                <Table.Th>{t('users.colName')}</Table.Th>
                <Table.Th>{t('users.colTier')}</Table.Th>
                <Table.Th>{t('users.colCoins')}</Table.Th>
                <Table.Th>{t('users.colPhone')}</Table.Th>
                <Table.Th>{t('users.colJoined')}</Table.Th>
                <Table.Th>{t('users.colActions')}</Table.Th>
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

      <Modal opened={giftOpen} onClose={() => setGiftOpen(false)} title={t('users.giftTitle')}>
        {activeUser ? (
          <Stack gap="sm">
            <TextInput label={t('users.giftFieldTitle')} value={giftTitle} onChange={(e) => setGiftTitle(e.target.value)} />
            <TextInput
              label={t('users.giftFieldDescription')}
              value={giftDescription}
              onChange={(e) => setGiftDescription(e.target.value)}
            />
            <TextInput
              label={t('users.giftFieldImage')}
              value={giftImageUrl}
              onChange={(e) => setGiftImageUrl(e.target.value)}
            />
            <NumberInput label={t('users.giftFieldCoins')} min={1} value={giftCoins} onChange={(v) => setGiftCoins(Number(v) || 1)} />
            <Button
              color="parfum"
              onClick={() => {
                if (!giftTitle.trim() || !activeUser) return;
                void giftUser({
                  userId: activeUser.id,
                  title: giftTitle.trim(),
                  description: giftDescription.trim(),
                  imageUrl: giftImageUrl.trim(),
                  coins: giftCoins,
                }).then(() => setGiftOpen(false));
              }}
            >
              {t('users.giftSend')}
            </Button>
          </Stack>
        ) : null}
      </Modal>

      <Modal
        opened={treeOpen}
        onClose={() => {
          setTreeOpen(false);
          setTreeUser(null);
        }}
        title={treeUser ? t('users.referralTreeTitle', { id: treeUser.telegramId }) : t('users.referralTree')}
        size="xl"
      >
        {treeLoading ? <Loader /> : null}
        {treeError ? (
          <Alert color="red" title={t('users.referralTreeErrorTitle')}>
            {t('users.referralTreeErrorBody')}
          </Alert>
        ) : null}
        {!treeLoading && !treeError && referralRoot ? (
          <AdminReferralTree root={referralRoot} maxDepth={treeMaxDepth} />
        ) : null}
      </Modal>

      <Modal opened={adjustOpen} onClose={() => setAdjustOpen(false)} title={t('users.adjustTitle')}>
        {activeUser ? (
          <Stack gap="sm">
            <PasswordInput
              label={t('users.adjustPassword')}
              value={adjPassword}
              onChange={(e) => setAdjPassword(e.target.value)}
            />
            <NumberInput
              label={t('users.adjustDelta')}
              value={adjDelta}
              onChange={(v) => setAdjDelta(Number(v) || 0)}
            />
            <TextInput label={t('users.adjustNote')} value={adjNote} onChange={(e) => setAdjNote(e.target.value)} />
            <Button
              color="parfum"
              onClick={() => {
                if (!activeUser || !adjPassword) return;
                void adjustCoins({
                  userId: activeUser.id,
                  password: adjPassword,
                  deltaUzs: adjDelta,
                  note: adjNote.trim() || undefined,
                }).then(() => setAdjustOpen(false));
              }}
            >
              {t('users.adjustSubmit')}
            </Button>
          </Stack>
        ) : null}
      </Modal>
    </Stack>
  );
}
