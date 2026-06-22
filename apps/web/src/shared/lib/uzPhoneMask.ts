import type { KeyboardEvent } from 'react';

/** Visible prefix including trailing space: "+998 " — not removable by the user. */
export const UZ_PHONE_PREFIX_DISPLAY = '+998 ';

const PREFIX_GUARD_LEN = UZ_PHONE_PREFIX_DISPLAY.length;

/** Extract up to 9 national digits (after 998) from any pasted or typed string. */
export function parseNationalDigits(input: string): string {
  const d = input.replace(/\D/g, '');
  if (d.startsWith('998')) return d.slice(3, 12);
  return d.slice(0, 9);
}

/**
 * Uzbek mobile display: +998 99 442 12 61 (groups: 2 + 3 + 2 + 2 after country code).
 */
export function formatUzPhoneDisplay(nationalDigits: string): string {
  const n = nationalDigits.replace(/\D/g, '').slice(0, 9);
  const g1 = n.slice(0, 2);
  const g2 = n.slice(2, 5);
  const g3 = n.slice(5, 7);
  const g4 = n.slice(7, 9);
  const chunks = [g1, g2, g3, g4].filter((c) => c.length > 0);
  return chunks.length ? `+998 ${chunks.join(' ')}` : UZ_PHONE_PREFIX_DISPLAY;
}

/** E.164 value for API when all 9 digits are present; otherwise undefined. */
export function uzPhoneToE164(nationalDigits: string): string | undefined {
  const n = nationalDigits.replace(/\D/g, '');
  if (n.length !== 9) return undefined;
  return `+998${n}`;
}

export function uzPhoneKeyDownGuard(e: KeyboardEvent<HTMLInputElement>): void {
  if (e.defaultPrevented) return;
  const el = e.currentTarget;
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;

  if (e.key === 'Backspace') {
    if (start !== end) return;
    if (start <= PREFIX_GUARD_LEN) e.preventDefault();
    return;
  }

  if (e.key === 'Delete') {
    if (start < PREFIX_GUARD_LEN) e.preventDefault();
  }
}
