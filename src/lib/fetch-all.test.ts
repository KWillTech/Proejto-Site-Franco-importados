import { describe, it, expect } from 'vitest';
import { fetchAll } from './fetch-all';

// Imita o PostgREST: no máximo 1000 linhas por consulta.
const table = (n: number) => (from: number, to: number) => {
  const data = Array.from({ length: n }, (_, i) => i).slice(from, Math.min(to, from + 999) + 1);
  return Promise.resolve({ data, error: null as { message: string } | null });
};

describe('fetchAll', () => {
  it('junta as páginas até acabar (1117 linhas)', async () => {
    const rows = await fetchAll(table(1117));
    expect(rows).toHaveLength(1117);
    expect(rows[1116]).toBe(1116);
  });

  it('para quando a última página vem cheia e a seguinte vazia (2000 linhas)', async () => {
    expect(await fetchAll(table(2000))).toHaveLength(2000);
  });

  it('lança o erro da consulta', async () => {
    await expect(fetchAll(() => Promise.resolve({ data: null, error: { message: 'falhou' } })))
      .rejects.toThrow('falhou');
  });
});
