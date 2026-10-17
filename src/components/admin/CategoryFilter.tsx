'use client';

import { buildTree } from '@/lib/categories';

type Cat = { id: string; name: string; slug: string; parentId: string | null };

export function CategoryFilter({ categories, current }: { categories: Cat[]; current: string }) {
  return (
    <select name="cat" aria-label="Categoria" defaultValue={current} onChange={(e) => e.currentTarget.form?.requestSubmit()}>
      <option value="">Todas as categorias</option>
      {buildTree(categories).map((c) => c.children.length === 0
        ? <option key={c.id} value={c.slug}>{c.name}</option>
        : (
          <optgroup key={c.id} label={c.name}>
            <option value={c.slug}>{c.name}</option>
            {c.children.map((k) => <option key={k.id} value={k.slug}>{k.name}</option>)}
          </optgroup>
        ))}
    </select>
  );
}
