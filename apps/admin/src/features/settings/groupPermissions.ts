import type { PermissionRow } from '../../app/parfumApi';

export function groupPermissionsByNamespace(
  permissions: PermissionRow[],
): Array<{ namespace: string; items: PermissionRow[] }> {
  const map = new Map<string, PermissionRow[]>();
  for (const p of permissions) {
    const ns = p.key.split('.')[0] ?? 'other';
    const list = map.get(ns) ?? [];
    list.push(p);
    map.set(ns, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([namespace, items]) => ({
      namespace,
      items: items.sort((x, y) => x.key.localeCompare(y.key)),
    }));
}
