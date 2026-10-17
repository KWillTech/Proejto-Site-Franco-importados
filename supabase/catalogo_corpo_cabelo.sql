-- Catálogo de perfumaria, parte 2: 6 itens de corpo e cabelo (3 body splashes e 1 loção da Victoria's Secret,
-- máscara e condicionador Shiseido Fino) na subcategoria nova "Corpo e Cabelo" de "Perfumaria".
-- Independente do catalogo_perfumaria.sql: pode rodar antes ou depois dele. Não apaga nada.
-- Rode inteiro no SQL Editor do Supabase, DEPOIS da 0003_subcategorias.sql, UMA vez só: a subcategoria
-- é criada se não existir, mas o segundo insert dos produtos falha por slug repetido (a transação desfaz tudo).
-- Preço de varejo = atacado = preço "À VISTA (DINHEIRO/PIX)" do catálogo, em centavos; pix_percent nulo
-- (sem desconto no Pix na vitrine), parcelamento em até 12x. As fotos ficam em public/produtos e vão no deploy.
-- A vitrine tem cache: pode levar até ~15 min (ou um novo deploy) para mostrar os produtos.

begin;

insert into public.categories (name, slug, parent_id, position, visible)
select 'Corpo e Cabelo', 'perfumes-arabes-corpo-e-cabelo', m.id,
  coalesce((select max(position) from public.categories where parent_id = m.id), -1) + 1, true
from public.categories m
where m.slug = 'perfumes-arabes'
on conflict (slug) do nothing;

create temp table novos (name text, slug text, description text, cents int) on commit drop;
insert into novos values
  ('Victoria''s Secret Bare Vanilla Body Splash 250ml', 'victoria-s-secret-bare-vanilla-body-splash-250ml', 'O best-seller absoluto da Victoria''s Secret. Uma fragrância aconchegante que combina baunilha batida cremosa com caxemira aveludada. Doce na medida certa, sensação de conforto e pele perfumada o dia todo.

Notas principais: Baunilha Batida, Maçã do Amor e Caxemira Aveludada.', 13500),
  ('Victoria''s Secret Love Spell Body Splash 250ml', 'victoria-s-secret-love-spell-body-splash-250ml', 'Fragrância clássica e inesquecível da VS. Uma combinação revigorante e charmosa de flor de cerejeira com o frescor suculento do pêssego fresco e toque de camomila. Perfeita para usar a qualquer hora.

Notas principais: Flor de Cerejeira, Pêssego Fresco, Maçã Vermelha e Camomila Suave.', 13500),
  ('Victoria''s Secret Pure Seduction Loção 236ml', 'victoria-s-secret-pure-seduction-locao-236ml', 'Loção hidratante corporal com absorção rápida e hidratação nutritiva 24h. Deixa a pele macia, sedosa e intensamente perfumada com o irresistível acorde de ameixa vermelha prensada e frésia doce.

Notas principais: Ameixa Vermelha Prensada, Frésia Doce e Extrato de Camomila Calmante.', 14560),
  ('Victoria''s Secret Pure Seduction Body Splash 250ml', 'victoria-s-secret-pure-seduction-body-splash-250ml', 'O aroma de frutas vermelhas mais desejado da marca. Uma bruma corporal energizante e sensual que destaca a ameixa rubi e a frésia fresca. Excelente para reaplicar e manter o frescor e charme o dia todo.

Notas principais: Ameixa Vermelha, Melão Suculento e Frésia Floral Doce.', 14560),
  ('Shiseido Fino Premium Touch Máscara Capilar 230g', 'shiseido-fino-premium-touch-mascara-capilar-230g', 'O tratamento capilar mais vendido e premiado do Japão. Formulada com geleia real, esqualano e PCA, repara cabelos danificados profundamente, devolvendo brilho espelhado, maciez extrema e hidratação de salão.

Ativos principais: Geleia Real Ex, Esqualano Hidratante, Trealose e Fitoesteróis Reconstrutores.', 14580),
  ('Shiseido Fino Premium Touch Condicionador 550ml', 'shiseido-fino-premium-touch-condicionador-550ml', 'Condicionador reconstrutor de alta performance com frasco pump generoso de 550ml. Sela as cutículas capilares instantaneamente, desembaraça, elimina o frizz e mantém os fios incrivelmente sedosos e nutridos.

Ativos principais: Proteína de Seda Hidrolisada, Óleo de Semente de Camélia, Geleia Real e Esqualano.', 15380);

insert into public.products (category_id, name, slug, description, featured, available, pix_percent, installments, option_names)
select c.id, n.name, n.slug, n.description, false, true, null, 12, '{}'
from novos n cross join public.categories c where c.slug = 'perfumes-arabes-corpo-e-cabelo';

insert into public.variants (product_id, option_values, retail_cents, wholesale_cents, available, position)
select p.id, '{}', n.cents, n.cents, true, 0
from novos n join public.products p on p.slug = n.slug;

insert into public.product_images (product_id, url, position)
select p.id, v.url, v.position
from (values
  ('victoria-s-secret-bare-vanilla-body-splash-250ml', '/produtos/victoria-s-secret-bare-vanilla-body-splash-250ml.jpg', 0),
  ('victoria-s-secret-love-spell-body-splash-250ml', '/produtos/victoria-s-secret-love-spell-body-splash-250ml.jpg', 0),
  ('victoria-s-secret-pure-seduction-locao-236ml', '/produtos/victoria-s-secret-pure-seduction-locao-236ml.jpg', 0),
  ('victoria-s-secret-pure-seduction-body-splash-250ml', '/produtos/victoria-s-secret-pure-seduction-body-splash-250ml.jpg', 0),
  ('shiseido-fino-premium-touch-mascara-capilar-230g', '/produtos/shiseido-fino-premium-touch-mascara-capilar-230g.jpg', 0),
  ('shiseido-fino-premium-touch-condicionador-550ml', '/produtos/shiseido-fino-premium-touch-condicionador-550ml.jpg', 0)
) as v(slug, url, position)
join public.products p on p.slug = v.slug;

-- Confere que a categoria mãe existe e os 6 entraram; se não, a transação inteira é desfeita.
do $$
begin
  if (select count(*) from public.products p join novos n on n.slug = p.slug) <> 6 then
    raise exception 'Esperava 6 produtos; confira se a categoria perfumes-arabes existe.';
  end if;
end $$;

commit;
