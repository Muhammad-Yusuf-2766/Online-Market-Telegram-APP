import { getPrimaryShade } from '@mantine/core';
import type {
  MantineColor,
  MantineColorScheme,
  MantineTheme,
} from '@mantine/core';
import type { OrderStatus } from '../../app/parfumApi';

/** Mantine palette keys used for badges, selects, and status emphasis. */
export const ORDER_STATUS_MANTINE_COLOR: Record<OrderStatus, MantineColor> = {
  PENDING: 'yellow',
  CONFIRMED: 'blue',
  SHIPPED: 'violet',
  DELIVERED: 'green',
  CANCELLED: 'red',
};

export function orderStatusAccent(
  theme: MantineTheme,
  status: OrderStatus,
  colorScheme: MantineColorScheme,
): string {
  const key = ORDER_STATUS_MANTINE_COLOR[status];
  const shade = getPrimaryShade(theme, colorScheme);
  return theme.colors[key][shade];
}

/** Soft pill background for a status; label text should use theme default (`--mantine-color-text`). */
export function orderStatusTintBackground(
  theme: MantineTheme,
  status: OrderStatus,
  colorScheme: MantineColorScheme,
  mixPercent = 22,
): string {
  const accent = orderStatusAccent(theme, status, colorScheme);
  return `color-mix(in srgb, ${accent} ${mixPercent}%, transparent)`;
}
