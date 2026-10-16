-- Franco Importados: esquema inicial.
-- Rode inteiro no SQL Editor do Supabase (depois rode supabase/seed.sql).
-- Depois rode 0002_admins.sql e cadastre os donos em public.admins (instruções no topo dela); sem isso o painel não grava.

begin;

create extension if not exists pgcrypto;

-- ---------- tabelas ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  position int not null default 0,
  visible boolean not null default true,
  home_card boolean not null default false,
  home_card_image text,
  home_card_tag text
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text not null default '',
  featured boolean not null default false,
  available boolean not null default true,
  badge text,
  pix_percent numeric,
  installments int,
  option_names text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index products_category_id_idx on public.products (category_id);
create index products_featured_idx on public.products (featured) where featured;

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  position int not null default 0
);
create index product_images_product_id_idx on public.product_images (product_id);

create table public.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  option_values text[] not null default '{}',
  retail_cents int not null check (retail_cents >= 0),
  wholesale_cents int not null check (wholesale_cents >= 0),
  available boolean not null default true,
  position int not null default 0
);
create index variants_product_id_idx on public.variants (product_id);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  image_desktop text not null,
  image_mobile text not null,
  alt text not null default '',
  link text,
  position int not null default 0,
  active boolean not null default true
);

create table public.settings (
  id int primary key check (id = 1),
  whatsapp_number text not null,
  topbar_text text not null
);

insert into public.settings (id, whatsapp_number, topbar_text)
values (1, '5500000000000', '10% OFF no Pix em todo o site')
on conflict (id) do nothing;

-- ---------- privilégios explícitos (não dependem dos padrões do projeto) ----------
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.product_images, public.variants, public.banners, public.settings to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_images, public.variants, public.banners to authenticated;
-- settings é uma linha única: pode ser lida e editada, nunca criada nem apagada pelo painel.
grant update on public.settings to authenticated;

-- ---------- RLS: leitura pública, escrita só para quem está logado ----------
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.variants enable row level security;
alter table public.banners enable row level security;
alter table public.settings enable row level security;

create policy "categories_select" on public.categories for select to anon, authenticated using (true);
create policy "categories_insert" on public.categories for insert to authenticated with check (true);
create policy "categories_update" on public.categories for update to authenticated using (true) with check (true);
create policy "categories_delete" on public.categories for delete to authenticated using (true);

create policy "products_select" on public.products for select to anon, authenticated using (true);
create policy "products_insert" on public.products for insert to authenticated with check (true);
create policy "products_update" on public.products for update to authenticated using (true) with check (true);
create policy "products_delete" on public.products for delete to authenticated using (true);

create policy "product_images_select" on public.product_images for select to anon, authenticated using (true);
create policy "product_images_insert" on public.product_images for insert to authenticated with check (true);
create policy "product_images_update" on public.product_images for update to authenticated using (true) with check (true);
create policy "product_images_delete" on public.product_images for delete to authenticated using (true);

create policy "variants_select" on public.variants for select to anon, authenticated using (true);
create policy "variants_insert" on public.variants for insert to authenticated with check (true);
create policy "variants_update" on public.variants for update to authenticated using (true) with check (true);
create policy "variants_delete" on public.variants for delete to authenticated using (true);

create policy "banners_select" on public.banners for select to anon, authenticated using (true);
create policy "banners_insert" on public.banners for insert to authenticated with check (true);
create policy "banners_update" on public.banners for update to authenticated using (true) with check (true);
create policy "banners_delete" on public.banners for delete to authenticated using (true);

create policy "settings_select" on public.settings for select to anon, authenticated using (true);
create policy "settings_update" on public.settings for update to authenticated using (true) with check (id = 1);

-- ---------- Storage: bucket público "media" ----------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

create policy "media_select" on storage.objects for select to anon, authenticated using (bucket_id = 'media');
create policy "media_insert" on storage.objects for insert to authenticated with check (bucket_id = 'media');
create policy "media_update" on storage.objects for update to authenticated using (bucket_id = 'media') with check (bucket_id = 'media');
create policy "media_delete" on storage.objects for delete to authenticated using (bucket_id = 'media');

commit;
