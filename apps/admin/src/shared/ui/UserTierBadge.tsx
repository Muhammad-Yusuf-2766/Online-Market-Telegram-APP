import { Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { UserTier } from '../../app/parfumApi';

const TIER_COLORS: Record<UserTier, string> = {
  BRONZE: 'orange',
  SILVER: 'gray',
  GOLD: 'yellow',
  PLATINUM: 'cyan',
};

export function UserTierBadge({ tier, size }: { tier: UserTier; size?: 'xs' | 'sm' | 'md' }) {
  const { t } = useTranslation();
  return (
    <Badge color={TIER_COLORS[tier]} variant="light" size={size ?? 'sm'}>
      {t(`userTier.${tier}` as const, tier)}
    </Badge>
  );
}
