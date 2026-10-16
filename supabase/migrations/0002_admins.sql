-- Franco Importados: gravação só para administradores.
-- A 0001 deixava qualquer usuário logado gravar; se o cadastro público do Supabase estiver ligado,
-- qualquer pessoa poderia criar uma conta e alterar a loja. Aqui a escrita passa a exigir public.is_admin().
--
-- Rode inteiro no SQL Editor do Supabase, depois da 0001. Em seguida cadastre os donos (troque pelos e-mails
-- das contas já criadas em Authentication > Users):
--   insert into public.admins (user_id) select id from auth.users where email in ('...');
-- ATENÇÃO: sem esse insert o painel não grava nada (salvar, excluir, reordenar e enviar fotos falham).

begin;

-- ---------- quem administra ----------
create table public.admins (
  user_id uuid primary key references auth.users on delete cascade
);
alter table public.admins enable row level security;
-- Sem política e sem privilégio: só o SQL Editor (ou a função abaixo) lê esta tabela.
revoke all on public.admins from anon, authenticated;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------- escrita nas tabelas: true -> public.is_admin() (leitura não muda) ----------
drop policy if exists "categories_insert" on public.categories;
drop policy if exists "categories_update" on public.categories;
drop policy if exists "categories_delete" on public.categories;
create policy "categories_insert" on public.categories for insert to authenticated with check (public.is_admin());
create policy "categories_update" on public.categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "categories_delete" on public.categories for delete to authenticated using (public.is_admin());

drop policy if exists "products_insert" on public.products;
drop policy if exists "products_update" on public.products;
drop policy if exists "products_delete" on public.products;
create policy "products_insert" on public.products for insert to authenticated with check (public.is_admin());
create policy "products_update" on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "products_delete" on public.products for delete to authenticated using (public.is_admin());

drop policy if exists "product_images_insert" on public.product_images;
drop policy if exists "product_images_update" on public.product_images;
drop policy if exists "product_images_delete" on public.product_images;
create policy "product_images_insert" on public.product_images for insert to authenticated with check (public.is_admin());
create policy "product_images_update" on public.product_images for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "product_images_delete" on public.product_images for delete to authenticated using (public.is_admin());

drop policy if exists "variants_insert" on public.variants;
drop policy if exists "variants_update" on public.variants;
drop policy if exists "variants_delete" on public.variants;
create policy "variants_insert" on public.variants for insert to authenticated with check (public.is_admin());
create policy "variants_update" on public.variants for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "variants_delete" on public.variants for delete to authenticated using (public.is_admin());

drop policy if exists "banners_insert" on public.banners;
drop policy if exists "banners_update" on public.banners;
drop policy if exists "banners_delete" on public.banners;
create policy "banners_insert" on public.banners for insert to authenticated with check (public.is_admin());
create policy "banners_update" on public.banners for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "banners_delete" on public.banners for delete to authenticated using (public.is_admin());

drop policy if exists "settings_update" on public.settings;
create policy "settings_update" on public.settings for update to authenticated using (public.is_admin()) with check (id = 1);

-- ---------- Storage: escrita no bucket "media" ----------
drop policy if exists "media_insert" on storage.objects;
drop policy if exists "media_update" on storage.objects;
drop policy if exists "media_delete" on storage.objects;
create policy "media_insert" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "media_update" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());
create policy "media_delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());

commit;
