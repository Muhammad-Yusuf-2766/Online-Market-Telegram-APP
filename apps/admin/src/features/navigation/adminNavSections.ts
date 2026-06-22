import type { TFunction } from 'i18next';
import {
  IconChartBar,
  IconChecklist,
  IconCoin,
  IconGift,
  IconHierarchy,
  IconHome,
  IconLayoutDashboard,
  IconLink,
  IconMessageCircle,
  IconPackage,
  IconReportMoney,
  IconScale,
  IconSettings,
  IconShoppingCart,
  IconSpeakerphone,
  IconTag,
  IconTimeline,
  IconUsers,
} from '@tabler/icons-react';
import { PERM } from '../auth/permissions';

export type AdminNavItem = {
  to: string;
  label: string;
  icon: typeof IconHome;
  /** If set, item is shown only when user has this permission. */
  perm?: string;
  /** Always visible for any authenticated admin. */
  always?: boolean;
};

export type AdminNavSection = {
  title: string;
  items: AdminNavItem[];
};

export function getAdminNavSections(t: TFunction): AdminNavSection[] {
  return [
    {
      title: t('navSections.home'),
      items: [
        { to: '/welcome', label: t('nav.welcome'), icon: IconHome, always: true },
      ],
    },
    {
      title: t('navSections.dashboard'),
      items: [
        { to: '/dashboard', label: t('nav.dashboard'), icon: IconLayoutDashboard, perm: PERM.dashboard.view },
        { to: '/insights', label: t('nav.insights'), icon: IconChartBar, perm: PERM.insights.view },
      ],
    },
    {
      title: t('navSections.orders'),
      items: [
        { to: '/orders', label: t('nav.orders'), icon: IconShoppingCart, perm: PERM.orders.view },
        {
          to: '/product-feedback',
          label: t('nav.productFeedback'),
          icon: IconMessageCircle,
          perm: PERM.productFeedback.view,
        },
      ],
    },
    {
      title: t('navSections.productSettings'),
      items: [
        { to: '/products', label: t('nav.products'), icon: IconPackage, perm: PERM.products.view },
        { to: '/size-presets', label: t('nav.sizePresets'), icon: IconScale, perm: PERM.sizePresets.view },
        { to: '/categories', label: t('nav.categories'), icon: IconHierarchy, perm: PERM.categories.view },
        { to: '/brands', label: t('nav.brands'), icon: IconTag, perm: PERM.brands.view },
        { to: '/banners', label: t('nav.banners'), icon: IconSpeakerphone, perm: PERM.banners.view },
      ],
    },
    {
      title: t('navSections.users'),
      items: [{ to: '/users', label: t('nav.users'), icon: IconUsers, perm: PERM.users.view }],
    },
    {
      title: t('navSections.finance'),
      items: [{ to: '/finance', label: t('nav.finance'), icon: IconReportMoney, perm: PERM.finance.view }],
    },
    {
      title: t('navSections.referralSystem'),
      items: [
        { to: '/rewards', label: t('nav.rewards'), icon: IconCoin, perm: PERM.rewards.view },
        { to: '/coin-gifts', label: t('nav.coinGifts'), icon: IconGift, perm: PERM.coinGifts.view },
        { to: '/coin-ledger', label: t('nav.coinLedger'), icon: IconTimeline, perm: PERM.coinLedger.view },
        { to: '/campaigns', label: t('nav.campaigns'), icon: IconLink, perm: PERM.campaigns.view },
        { to: '/promotions', label: t('nav.promotions'), icon: IconTag, perm: PERM.promotions.view },
        { to: '/segments', label: t('nav.segments'), icon: IconHierarchy, perm: PERM.segments.view },
        { to: '/broadcasts', label: t('nav.broadcasts'), icon: IconSpeakerphone, perm: PERM.broadcasts.view },
        { to: '/automations', label: t('nav.automations'), icon: IconChecklist, perm: PERM.automations.view },
      ],
    },
    {
      title: t('navSections.operations'),
      items: [{ to: '/inventory', label: t('nav.inventory'), icon: IconPackage, perm: PERM.inventory.view }],
    },
    {
      title: t('navSections.settings'),
      items: [
        {
          to: '/settings/admin-users',
          label: t('nav.settingsAdminUsers'),
          icon: IconUsers,
          perm: PERM.settings.users.view,
        },
        {
          to: '/settings/roles',
          label: t('nav.settingsRoles'),
          icon: IconSettings,
          perm: PERM.settings.roles.view,
        },
        {
          to: '/settings/permissions',
          label: t('nav.settingsPermissions'),
          icon: IconSettings,
          perm: PERM.settings.permissions.view,
        },
      ],
    },
  ];
}

export function filterNavSections(
  sections: AdminNavSection[],
  hasPermission: (key: string) => boolean,
): AdminNavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => item.always || (item.perm != null && hasPermission(item.perm)),
      ),
    }))
    .filter((section) => section.items.length > 0);
}
