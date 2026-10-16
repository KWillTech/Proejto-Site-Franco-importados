import Link from 'next/link';
import type { Category } from '@/lib/types';
import styles from './CategoryCards.module.css';

export function CategoryCards({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;
  return (
    <section className="container">
      <div className={styles.banners}>
        {categories.map((c) => (
          <div key={c.id} className={styles.col}>
            <Link className={styles.banner} href={`/categoria/${c.slug}`}>
              <div className={styles.img}>
                <h4>{c.name}</h4>
                {c.homeCardTag && <small>{c.homeCardTag}</small>}
                <div className={styles.art}>
                  {c.homeCardImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.homeCardImage} alt="" loading="lazy" />
                  )}
                </div>
              </div>
              <div className={styles.txt}>
                <h3>Conheça todos</h3>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
