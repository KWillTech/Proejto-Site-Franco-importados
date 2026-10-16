import type { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';
import styles from './ProductGrid.module.css';

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className={styles.grid}>
      {products.map((p) => (
        <div key={p.id} className={styles.col}>
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}
