import { getParfumApiBaseUrl } from '../../app/apiBase';

export type FinanceCsvKind = 'series' | 'orders';

export async function downloadFinanceCsv(
  kind: FinanceCsvKind,
  from: string,
  to: string,
  accessToken: string | null,
): Promise<void> {
  if (!accessToken) {
    throw new Error('Not authenticated');
  }
  const path = kind === 'series' ? '/admin/finance/report.csv' : '/admin/finance/orders.csv';
  const url = new URL(`${getParfumApiBaseUrl()}${path}`);
  url.searchParams.set('from', from);
  url.searchParams.set('to', to);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Export failed (${res.status})`);
  }

  const disposition = res.headers.get('Content-Disposition');
  const filenameMatch = disposition?.match(/filename="([^"]+)"/);
  const filename = filenameMatch?.[1] ?? `finance-${from}_${to}.csv`;
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}
