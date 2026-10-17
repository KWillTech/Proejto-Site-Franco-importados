// Puro: usado também em componente cliente.
export function buildTree<T extends { id: string; parentId: string | null }>(rows: T[]): Array<T & { children: T[] }> {
  const roots = rows.filter((r) => !r.parentId).map((r) => ({ ...r, children: [] as T[] }));
  for (const r of rows) roots.find((p) => p.id === r.parentId)?.children.push(r);
  return roots;
}

export function moveAmongSiblings(rows: Array<{ id: string; parentId: string | null }>, id: string, dir: -1 | 1): string[] | null {
  const me = rows.find((r) => r.id === id);
  if (!me) return null;
  const sibs = rows.filter((r) => r.parentId === me.parentId);
  const other = sibs[sibs.indexOf(me) + dir];
  if (!other) return null;
  const ids = rows.map((r) => r.id);
  const a = ids.indexOf(id), b = ids.indexOf(other.id);
  [ids[a], ids[b]] = [ids[b], ids[a]];
  return ids;
}
