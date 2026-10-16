'use server';

import { getVariantsByIds } from '@/lib/data';
import type { Product, Variant } from '@/lib/types';
import { isId } from '@/lib/validation';

const MAX_IDS = 100;

// Só leitura. Os ids vêm do navegador: entrada fora do formato é recusada e o carrinho não é alterado.
export async function refreshCart(variantIds: string[]): Promise<Array<{ variant: Variant; product: Product }>> {
  if (!Array.isArray(variantIds) || variantIds.length > MAX_IDS
    || !variantIds.every(isId)) {
    throw new Error('Lista de variações inválida.');
  }
  return getVariantsByIds(variantIds);
}
