import Link from 'next/link';
import type { Category } from '@/lib/types';
import styles from './CategoryCards.module.css';

export function CategoryCards({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;
  return (
    <section className="container">
      <div className={styles.banners}>
        {categories.map((c) => {
          // Foto pronta (jpg/png/webp) já traz o título e a arte: ocupa o cartão inteiro.
          // Arte em SVG (as ilustrações padrão) continua embaixo do título e da tag.
          const photo = !!c.homeCardImage && !/\.svg(\?|$)/i.test(c.homeCardImage);
          return (
            <div key={c.id} className={styles.col}>
              <Link className={styles.banner} href={`/categoria/${c.slug}`}>
                {photo ? (
                  <div className={`${styles.img} ${styles.photo}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.homeCardImage!} alt={c.name} loading="lazy" />
                  </div>
                ) : (
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
                )}
                <div className={styles.txt}>
                  <h3>Conheça todos</h3>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
