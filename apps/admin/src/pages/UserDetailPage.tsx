import {
  Alert,
  Anchor,
  Badge,
  Card,
  Code,
  Grid,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { useGetUserDetails360Query } from '../app/parfumApi';
import { formatPrice } from '../shared/lib/money';
import { UserTierBadge } from '../shared/ui/UserTierBadge';

function formatDate(value: string | null | undefined, withTime = false): string {
  if (!value) return '—';
  return dayjs(value).format(withTime ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD');
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card withBorder padding="md" radius="md">
      <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
        {label}
      </Text>
      <Title order={4} mt={4}>
        {value}
      </Title>
      {hint ? (
        <Text size="xs" c="dimmed" mt={2}>
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}

export function UserDetailPage() {
  const { t } = useTranslation();
  const { userId = '' } = useParams<{ userId: string }>();
  const { data, isLoading, error } = useGetUserDetails360Query(userId, { skip: !userId });

  if (isLoading) return <Loader />;
  if (error)
    return (
      <Alert color="red" title={t('users.loadErrorTitle')}>
        {t('users.loadErrorBody')}
      </Alert>
    );
  if (!data) return null;
  const { user, kpis } = data;

  const profileBonusFlags: Array<{ key: string; on: boolean }> = [
    { key: 'birthdate', on: user.profileBonusBirthdateDone },
    { key: 'gender', on: user.profileBonusGenderDone },
    { key: 'lastName', on: user.profileBonusLastNameDone },
    { key: 'full', on: user.profileBonusFullDone },
  ];

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <div>
          <Title order={2}>
            {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.telegramId}
          </Title>
          <Group gap="xs" mt={4}>
            <UserTierBadge tier={user.tier} size="md" />
            <Badge variant="light" color="grape">
              {user.locale.toUpperCase()}
            </Badge>
            <Text size="sm" c="dimmed" ff="monospace">
              {user.telegramId}
            </Text>
          </Group>
        </div>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatCard label={t('userDetail.coinBalance')} value={formatPrice(user.coinBalance)} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatCard label={t('userDetail.ordersCount')} value={kpis.ordersCount} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatCard label={t('userDetail.deliveredOrders')} value={kpis.deliveredOrders} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatCard label={t('userDetail.cancelledOrders')} value={kpis.cancelledOrders} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatCard label={t('userDetail.ltv')} value={formatPrice(kpis.ltvUzs)} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatCard label={t('userDetail.aov')} value={formatPrice(kpis.aovUzs)} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatCard
            label={t('userDetail.coinsLifetimeEarned')}
            value={formatPrice(kpis.coinsLifetimeEarned)}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatCard
            label={t('userDetail.coinsLifetimeSpent')}
            value={formatPrice(kpis.coinsLifetimeSpent)}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatCard label={t('userDetail.referralCount')} value={kpis.referralCount} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatCard label={t('userDetail.wishlistCount')} value={kpis.wishlistCount} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatCard
            label={t('userDetail.lastOrderAt')}
            value={formatDate(kpis.lastOrderAt, true)}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <StatCard
            label={t('userDetail.createdAt')}
            value={formatDate(user.createdAt)}
          />
        </Grid.Col>
      </Grid>

      <Card withBorder padding="lg" radius="md">
        <Title order={5} mb="sm">
          {t('userDetail.title')}
        </Title>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Text size="xs" c="dimmed">
              {t('userDetail.username')}
            </Text>
            <Text>{user.telegramUsername ? `@${user.telegramUsername}` : '—'}</Text>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Text size="xs" c="dimmed">
              {t('userDetail.phone')}
            </Text>
            <Text>{user.phone ?? '—'}</Text>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Text size="xs" c="dimmed">
              {t('userDetail.birthDate')}
            </Text>
            <Text>{formatDate(user.birthDate)}</Text>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Text size="xs" c="dimmed">
              {t('userDetail.gender')}
            </Text>
            <Text>{user.gender}</Text>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Text size="xs" c="dimmed">
              {t('userDetail.locale')}
            </Text>
            <Text>{user.locale}</Text>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Text size="xs" c="dimmed">
              {t('userDetail.referralCode')}
            </Text>
            <Code>{user.referralCode}</Code>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Text size="xs" c="dimmed">
              {t('userDetail.referredBy')}
            </Text>
            {user.referredBy ? (
              <Anchor component={Link} to={`/users/${user.referredBy.id}`} size="sm">
                {[user.referredBy.firstName, user.referredBy.lastName].filter(Boolean).join(' ') ||
                  user.referredBy.telegramUsername ||
                  user.referredBy.id}
              </Anchor>
            ) : (
              <Text size="sm" c="dimmed">
                {t('userDetail.noReferredBy')}
              </Text>
            )}
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Text size="xs" c="dimmed">
              {t('userDetail.campaign')}
            </Text>
            {user.campaign ? (
              <Text>
                {user.campaign.name} <Text span c="dimmed" size="xs">({user.campaign.slug})</Text>
              </Text>
            ) : (
              <Text size="sm" c="dimmed">
                {t('userDetail.noCampaign')}
              </Text>
            )}
          </Grid.Col>
          <Grid.Col span={12}>
            <Text size="xs" c="dimmed">
              {t('userDetail.profileBonus')}
            </Text>
            <Group gap="xs" mt={4}>
              {profileBonusFlags.map((f) => (
                <Badge key={f.key} color={f.on ? 'green' : 'gray'} variant={f.on ? 'filled' : 'light'}>
                  {f.key}
                  {f.on ? ' ✓' : ''}
                </Badge>
              ))}
            </Group>
          </Grid.Col>
        </Grid>
      </Card>

      <Card withBorder padding="lg" radius="md">
        <Title order={5} mb="sm">
          {t('userDetail.ordersTable')}
        </Title>
        <Table striped withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('userDetail.colOrder')}</Table.Th>
              <Table.Th>{t('userDetail.colStatus')}</Table.Th>
              <Table.Th>{t('userDetail.colTotal')}</Table.Th>
              <Table.Th>{t('userDetail.colCreated')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {user.orders.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <Code>{row.id.slice(-8)}</Code>
                </Table.Td>
                <Table.Td>{t(`orderStatus.${row.status}` as const, row.status)}</Table.Td>
                <Table.Td>{formatPrice(row.totalUzs)}</Table.Td>
                <Table.Td>{formatDate(row.createdAt, true)}</Table.Td>
              </Table.Tr>
            ))}
            {user.orders.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    —
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </Card>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder padding="lg" radius="md">
            <Title order={5} mb="sm">
              {t('userDetail.coinLedger')}
            </Title>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('userDetail.colCreated')}</Table.Th>
                  <Table.Th>{t('userDetail.colKind')}</Table.Th>
                  <Table.Th>{t('userDetail.colDelta')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {user.coinLedger.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>{formatDate(row.createdAt, true)}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="xs">
                        {t(`coinLedger.kind.${row.kind}` as const, row.kind)}
                      </Badge>
                    </Table.Td>
                    <Table.Td c={row.delta >= 0 ? 'teal' : 'red'}>
                      {row.delta >= 0 ? '+' : ''}
                      {formatPrice(row.delta)}
                    </Table.Td>
                  </Table.Tr>
                ))}
                {user.coinLedger.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={3}>
                      <Text size="sm" c="dimmed" ta="center" py="md">
                        —
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder padding="lg" radius="md">
            <Title order={5} mb="sm">
              {t('userDetail.wishlist')}
            </Title>
            <Stack gap="xs">
              {user.wishlistItems.map((w) => (
                <Group key={w.id} justify="space-between">
                  <Text size="sm">{w.product.title}</Text>
                  <Text size="sm" c="dimmed">
                    {formatPrice(w.product.priceUzs)}
                  </Text>
                </Group>
              ))}
              {user.wishlistItems.length === 0 ? (
                <Text size="sm" c="dimmed">
                  —
                </Text>
              ) : null}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder padding="lg" radius="md">
            <Title order={5} mb="sm">
              {t('userDetail.feedbacks')}
            </Title>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('userDetail.colProduct')}</Table.Th>
                  <Table.Th>{t('userDetail.colStars')}</Table.Th>
                  <Table.Th>{t('userDetail.colStatus')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {user.productFeedbacks.map((f) => (
                  <Table.Tr key={f.id}>
                    <Table.Td>{f.product.title}</Table.Td>
                    <Table.Td>{f.stars}</Table.Td>
                    <Table.Td>{f.status}</Table.Td>
                  </Table.Tr>
                ))}
                {user.productFeedbacks.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={3}>
                      <Text size="sm" c="dimmed" ta="center" py="md">
                        —
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder padding="lg" radius="md">
            <Title order={5} mb="sm">
              {t('userDetail.referrals')}
            </Title>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('userDetail.colReferee')}</Table.Th>
                  <Table.Th>{t('userDetail.colCoins')}</Table.Th>
                  <Table.Th>{t('userDetail.colCreated')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {user.referralRewardsAsReferrer.map((r) => (
                  <Table.Tr key={r.id}>
                    <Table.Td>
                      {[r.referee.firstName, r.referee.lastName].filter(Boolean).join(' ') ||
                        r.referee.telegramUsername ||
                        r.referee.id}
                    </Table.Td>
                    <Table.Td c="teal">+{formatPrice(r.coins)}</Table.Td>
                    <Table.Td>{formatDate(r.createdAt, true)}</Table.Td>
                  </Table.Tr>
                ))}
                {user.referralRewardsAsReferrer.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={3}>
                      <Text size="sm" c="dimmed" ta="center" py="md">
                        —
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder padding="lg" radius="md">
            <Title order={5} mb="sm">
              {t('userDetail.coinGifts')}
            </Title>
            <Stack gap="xs">
              {user.adminCoinGifts.map((g) => (
                <Group key={g.id} justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>
                      {g.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatDate(g.createdAt, true)}
                    </Text>
                  </div>
                  <Text size="sm" c="teal">
                    +{formatPrice(g.coins)}
                  </Text>
                </Group>
              ))}
              {user.adminCoinGifts.length === 0 ? (
                <Text size="sm" c="dimmed">
                  —
                </Text>
              ) : null}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder padding="lg" radius="md">
            <Title order={5} mb="sm">
              {t('userDetail.redemptions')}
            </Title>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('userDetail.colPromoCode')}</Table.Th>
                  <Table.Th>{t('userDetail.colDiscount')}</Table.Th>
                  <Table.Th>{t('userDetail.colCreated')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {user.promoRedemptions.map((r) => (
                  <Table.Tr key={r.id}>
                    <Table.Td>
                      <Code>{r.promoCode.code}</Code>
                    </Table.Td>
                    <Table.Td>{formatPrice(r.discountUzs)}</Table.Td>
                    <Table.Td>{formatDate(r.redeemedAt, true)}</Table.Td>
                  </Table.Tr>
                ))}
                {user.promoRedemptions.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={3}>
                      <Text size="sm" c="dimmed" ta="center" py="md">
                        —
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder padding="lg" radius="md">
            <Title order={5} mb="sm">
              {t('userDetail.segments')}
            </Title>
            <Stack gap="xs">
              {user.segmentMemberships.map((m) => (
                <Badge key={m.segment.id} variant="light">
                  {m.segment.name}
                </Badge>
              ))}
              {user.segmentMemberships.length === 0 ? (
                <Text size="sm" c="dimmed">
                  —
                </Text>
              ) : null}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder padding="lg" radius="md">
            <Title order={5} mb="sm">
              {t('userDetail.cart')}
            </Title>
            <Stack gap="xs">
              {user.cart?.items.map((item) => (
                <Group key={item.id} justify="space-between">
                  <Text size="sm">
                    {item.product.title}
                    {item.sizeSlug ? ` · ${item.sizeSlug}` : ''} × {item.qty}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {formatPrice(item.product.priceUzs)}
                  </Text>
                </Group>
              ))}
              {!user.cart?.items.length ? (
                <Text size="sm" c="dimmed">
                  —
                </Text>
              ) : null}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
