const PAGE = 1000; // max-rows do PostgREST: uma consulta nunca devolve mais que isso

/** Lê todas as linhas em páginas de 1000. A consulta precisa ter ordem estável (ex.: .order('id')). */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    all.push(...(data ?? []));
    if (!data || data.length < PAGE) return all;
  }
}
