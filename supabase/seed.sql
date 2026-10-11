-- Dados de exemplo (fictícios). Rode DEPOIS de 0001_init.sql, no SQL Editor do Supabase.
-- Pode ser executado de novo: limpa o catálogo e recria. Não mexe em "settings".

begin;

delete from public.product_images;
delete from public.variants;
delete from public.products;
delete from public.banners;
delete from public.categories;

insert into public.categories (name, slug, position, visible, home_card, home_card_image, home_card_tag) values
  ('iPhone', 'iphone', 1, true, true, '/placeholders/card-iphone.svg', 'ORIGINAIS · LACRADOS'),
  ('MacBook', 'macbook', 2, true, true, '/placeholders/card-macbook.svg', 'ORIGINAIS · LACRADOS'),
  ('PlayStation', 'playstation', 3, true, false, null, null),
  ('Xiaomi', 'xiaomi', 4, true, false, null, null),
  ('Perfumes árabes', 'perfumes-arabes', 5, true, true, '/placeholders/card-perfumes-arabes.svg', 'IMPORTADOS · ÁRABES'),
  ('Perfumes importados', 'perfumes-importados', 6, true, false, null, null);

insert into public.products (category_id, name, slug, description, featured, available, badge, pix_percent, installments, option_names, created_at)
select c.id, v.name, v.slug, v.description, v.featured, v.available, v.badge, v.pix_percent, v.installments, v.option_names, now() + v.ord * interval '1 second'
from (values
  ('iphone', 'iPhone 17 Pro', 'iphone-17-pro', 'iPhone 17 Pro. Produto de exemplo — original e lacrado.', true, true, null::text, 10::numeric, 12::int, array['Cor', 'Armazenamento']::text[], 0),
  ('iphone', 'iPhone 17 Pro Max', 'iphone-17-pro-max', 'iPhone 17 Pro Max. Produto de exemplo — original e lacrado.', false, true, null::text, 10::numeric, 12::int, array['Cor', 'Armazenamento']::text[], 1),
  ('macbook', 'MacBook Air M4 13"', 'macbook-air-m4-13', 'MacBook Air M4 13". Produto de exemplo — original e lacrado.', true, true, null::text, 10::numeric, 12::int, array[]::text[], 2),
  ('playstation', 'PlayStation 5 Slim', 'playstation-5-slim', 'PlayStation 5 Slim. Produto de exemplo — original e lacrado.', true, true, 'FRETE GRÁTIS', 10::numeric, 12::int, array[]::text[], 3),
  ('xiaomi', 'Xiaomi 15 Ultra 512GB', 'xiaomi-15-ultra-512gb', 'Xiaomi 15 Ultra 512GB. Produto de exemplo — original e lacrado.', true, true, '5% OFF', 10::numeric, 12::int, array[]::text[], 4),
  ('xiaomi', 'Xiaomi Redmi Note 14 Pro', 'xiaomi-redmi-note-14-pro', 'Xiaomi Redmi Note 14 Pro. Produto de exemplo — original e lacrado.', false, true, '17% OFF', 10::numeric, 12::int, array[]::text[], 5),
  ('iphone', 'iPhone 16', 'iphone-16', 'iPhone 16. Produto de exemplo — original e lacrado.', false, true, null::text, 10::numeric, 12::int, array['Cor']::text[], 6),
  ('macbook', 'MacBook Pro M4 14"', 'macbook-pro-m4-14', 'MacBook Pro M4 14". Produto de exemplo — original e lacrado.', false, true, null::text, 10::numeric, 12::int, array[]::text[], 7),
  ('perfumes-arabes', 'Lattafa Khamrah EDP 100ml', 'lattafa-khamrah-edp-100ml', 'Lattafa Khamrah EDP 100ml. Produto de exemplo — original e lacrado.', true, true, 'MAIS VENDIDO', 10::numeric, null::int, array[]::text[], 8),
  ('perfumes-arabes', 'Lattafa Asad EDP 100ml', 'lattafa-asad-edp-100ml', 'Lattafa Asad EDP 100ml. Produto de exemplo — original e lacrado.', true, true, null::text, 10::numeric, null::int, array[]::text[], 9),
  ('perfumes-arabes', 'Al Haramain Amber Oud Gold 120ml', 'al-haramain-amber-oud-gold-120ml', 'Al Haramain Amber Oud Gold 120ml. Produto de exemplo — original e lacrado.', true, true, '10% OFF', 10::numeric, null::int, array[]::text[], 10),
  ('perfumes-importados', 'Armaf Club de Nuit Intense 105ml', 'armaf-club-de-nuit-intense-105ml', 'Armaf Club de Nuit Intense 105ml. Produto de exemplo — original e lacrado.', false, true, null::text, 10::numeric, null::int, array[]::text[], 11),
  ('perfumes-arabes', 'Lattafa Yara EDP 100ml', 'lattafa-yara-edp-100ml', 'Lattafa Yara EDP 100ml. Produto de exemplo — original e lacrado.', true, true, null::text, 10::numeric, null::int, array['Tamanho']::text[], 12),
  ('perfumes-arabes', 'Afnan 9PM EDP 100ml', 'afnan-9pm-edp-100ml', 'Afnan 9PM EDP 100ml. Produto de exemplo — original e lacrado.', false, true, null::text, 10::numeric, null::int, array[]::text[], 13),
  ('perfumes-importados', 'Rasasi Hawas for Him 100ml', 'rasasi-hawas-for-him-100ml', 'Rasasi Hawas for Him 100ml. Produto de exemplo — original e lacrado.', false, true, 'FRETE GRÁTIS', 10::numeric, null::int, array[]::text[], 14),
  ('perfumes-importados', 'Maison Alhambra Jean Lowe 100ml', 'maison-alhambra-jean-lowe-100ml', 'Maison Alhambra Jean Lowe 100ml. Produto de exemplo — original e lacrado.', false, true, null::text, 10::numeric, null::int, array[]::text[], 15)
) as v(cat_slug, name, slug, description, featured, available, badge, pix_percent, installments, option_names, ord)
join public.categories c on c.slug = v.cat_slug;

insert into public.product_images (product_id, url, position)
select p.id, v.url, v.position
from (values
  ('iphone-17-pro', '/placeholders/phone-blue.svg', 1),
  ('iphone-17-pro', '/placeholders/phone-silver.svg', 2),
  ('iphone-17-pro-max', '/placeholders/phone-wine.svg', 1),
  ('iphone-17-pro-max', '/placeholders/phone-dark.svg', 2),
  ('macbook-air-m4-13', '/placeholders/laptop-gold.svg', 1),
  ('playstation-5-slim', '/placeholders/ps5.svg', 1),
  ('xiaomi-15-ultra-512gb', '/placeholders/xiaomi-dark.svg', 1),
  ('xiaomi-redmi-note-14-pro', '/placeholders/xiaomi-blue.svg', 1),
  ('iphone-16', '/placeholders/phone-pink.svg', 1),
  ('iphone-16', '/placeholders/phone-black.svg', 2),
  ('macbook-pro-m4-14', '/placeholders/laptop-blue.svg', 1),
  ('lattafa-khamrah-edp-100ml', '/placeholders/perfume-amber.svg', 1),
  ('lattafa-asad-edp-100ml', '/placeholders/perfume-black.svg', 1),
  ('al-haramain-amber-oud-gold-120ml', '/placeholders/perfume-gold.svg', 1),
  ('armaf-club-de-nuit-intense-105ml', '/placeholders/perfume-graphite.svg', 1),
  ('lattafa-yara-edp-100ml', '/placeholders/perfume-rose.svg', 1),
  ('afnan-9pm-edp-100ml', '/placeholders/perfume-navy.svg', 1),
  ('rasasi-hawas-for-him-100ml', '/placeholders/perfume-sky.svg', 1),
  ('maison-alhambra-jean-lowe-100ml', '/placeholders/perfume-wine.svg', 1)
) as v(slug, url, position)
join public.products p on p.slug = v.slug;

insert into public.variants (product_id, option_values, retail_cents, wholesale_cents, available, position)
select p.id, v.option_values, v.retail_cents, v.wholesale_cents, v.available, v.position
from (values
  ('iphone-17-pro', array['Azul', '256GB']::text[], 967072, 899000, true, 1),
  ('iphone-17-pro', array['Azul', '512GB']::text[], 968572, 900400, true, 2),
  ('iphone-17-pro', array['Prata', '256GB']::text[], 967072, 899000, true, 3),
  ('iphone-17-pro', array['Prata', '512GB']::text[], 968572, 900400, true, 4),
  ('iphone-17-pro-max', array['Vinho', '256GB']::text[], 1053599, 979000, true, 1),
  ('iphone-17-pro-max', array['Vinho', '512GB']::text[], 1055099, 980400, true, 2),
  ('iphone-17-pro-max', array['Preto', '256GB']::text[], 1053599, 979000, true, 3),
  ('iphone-17-pro-max', array['Preto', '512GB']::text[], 1055099, 980400, true, 4),
  ('macbook-air-m4-13', array[]::text[], 899990, 835000, true, 1),
  ('playstation-5-slim', array[]::text[], 379990, 339000, true, 1),
  ('xiaomi-15-ultra-512gb', array[]::text[], 642991, 589000, true, 1),
  ('xiaomi-redmi-note-14-pro', array[]::text[], 189990, 159000, false, 1),
  ('iphone-16', array['Rosa']::text[], 549990, 499000, true, 1),
  ('iphone-16', array['Preto']::text[], 549990, 499000, true, 2),
  ('macbook-pro-m4-14', array[]::text[], 1594979, 1490000, true, 1),
  ('lattafa-khamrah-edp-100ml', array[]::text[], 34990, 21990, true, 1),
  ('lattafa-asad-edp-100ml', array[]::text[], 28990, 17990, true, 1),
  ('al-haramain-amber-oud-gold-120ml', array[]::text[], 59990, 42990, true, 1),
  ('armaf-club-de-nuit-intense-105ml', array[]::text[], 37990, 25990, true, 1),
  ('lattafa-yara-edp-100ml', array['30 ml']::text[], 15990, 8990, true, 1),
  ('lattafa-yara-edp-100ml', array['100 ml']::text[], 27990, 16990, true, 2),
  ('afnan-9pm-edp-100ml', array[]::text[], 32990, 20990, true, 1),
  ('rasasi-hawas-for-him-100ml', array[]::text[], 45990, 31990, true, 1),
  ('maison-alhambra-jean-lowe-100ml', array[]::text[], 25990, 15990, true, 1)
) as v(slug, option_values, retail_cents, wholesale_cents, available, position)
join public.products p on p.slug = v.slug;

insert into public.banners (image_desktop, image_mobile, alt, link, position, active) values
  ('/placeholders/banner-iphone-1425x540.svg', '/placeholders/banner-iphone-800x800.svg', 'iPhone 17 Pro', null, 1, true),
  ('/placeholders/banner-perfumes-1425x540.svg', '/placeholders/banner-perfumes-800x800.svg', 'Perfumes árabes', null, 2, true),
  ('/placeholders/banner-playstation-1425x540.svg', '/placeholders/banner-playstation-800x800.svg', 'PlayStation 5', null, 3, true);

commit;
