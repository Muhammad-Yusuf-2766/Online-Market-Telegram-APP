import type { TFunction } from 'i18next';
import {
  IconHome,
  IconLayoutDashboard,
  IconMessageCircle,
  IconPackage,
  IconReportMoney,
  IconScale,
  IconSettings,
  IconShoppingCart,
  IconSpeakerphone,
  IconTags,
  IconUsers,
} from '@tabler/icons-react';

export type AdminNavItem = {
  to: string;
  label: string;
  icon: typeof IconHome;
  always?: boolean;
  perm?: string;
};

export type AdminNavSection = {
  title: string;
  items: AdminNavItem[];
};

export function getAdminNavSections(t: TFunction): AdminNavSection[] {
  return [
    {
      title: t('navSections.home'),
      items: [{ to: '/welcome', label: t('nav.welcome'), icon: IconHome, always: true }],
    },
    {
      title: t('navSections.dashboard'),
      items: [{ to: '/dashboard', label: t('nav.dashboard'), icon: IconLayoutDashboard, always: true }],
    },
    {
      title: t('navSections.orders'),
      items: [
        { to: '/orders', label: t('nav.orders'), icon: IconShoppingCart, always: true },
        { to: '/product-feedback', label: t('nav.productFeedback'), icon: IconMessageCircle, always: true },
      ],
    },
    {
      title: t('navSections.productSettings'),
      items: [
        { to: '/products', label: t('nav.products'), icon: IconPackage, always: true },
        { to: '/measurement-units', label: t('nav.measurementUnits'), icon: IconScale, always: true },
        { to: '/categories', label: t('nav.categories'), icon: IconTags, always: true },
        { to: '/banners', label: t('nav.banners'), icon: IconSpeakerphone, always: true },
      ],
    },
    {
      title: t('navSections.users'),
      items: [{ to: '/users', label: t('nav.users'), icon: IconUsers, always: true }],
    },
    {
      title: t('navSections.finance'),
      items: [{ to: '/finance', label: t('nav.finance'), icon: IconReportMoney, always: true }],
    },
    {
      title: t('navSections.messages'),
      items: [{ to: '/broadcasts', label: t('nav.broadcasts'), icon: IconSpeakerphone, always: true }],
    },
    {
      title: t('navSections.operations'),
      items: [{ to: '/inventory', label: t('nav.inventory'), icon: IconPackage, always: true }],
    },
    {
      title: t('navSections.settings'),
      items: [
        {
          to: '/settings/branding',
          label: t('nav.settingsBranding'),
          icon: IconSettings,
          always: true,
        },
        {
          to: '/settings/admin-users',
          label: t('nav.settingsAdminUsers'),
          icon: IconSettings,
          always: true,
        },
      ],
    },
  ];
}

export function filterNavSections(sections: AdminNavSection[]): AdminNavSection[] {
  return sections.filter((section) => section.items.length > 0);
}
