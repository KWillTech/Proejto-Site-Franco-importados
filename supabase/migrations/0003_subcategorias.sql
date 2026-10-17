-- Franco Importados: subcategorias (categoria mãe), dois níveis no máximo.
-- O painel já confere as regras antes de gravar; o trigger abaixo garante no banco mesmo se duas gravações
-- se cruzarem (um check não enxerga a linha da mãe, por isso trigger).
-- As políticas de RLS da 0002 já cobrem public.categories; nada muda nelas.
--
-- Rode inteiro no SQL Editor do Supabase, depois da 0002 e antes de publicar o app com subcategorias
-- (o painel passa a gravar parent_id e falha sem esta coluna). Verificação: select parent_id from public.categories limit 1;
-- Pode ser rodado de novo sem erro.

begin;

-- on delete restrict: o banco recusa excluir mãe com filhas (o app avisa antes).
alter table public.categories
  add column if not exists parent_id uuid references public.categories (id) on delete restrict;
create index if not exists categories_parent_id_idx on public.categories (parent_id);

create or replace function public.categories_two_levels()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_id is null then
    return new;
  end if;
  if new.parent_id = new.id then
    raise exception 'Uma categoria não pode ser mãe de si mesma.';
  end if;
  if exists (select 1 from public.categories where id = new.parent_id and parent_id is not null) then
    raise exception 'A categoria mãe precisa ser uma categoria principal.';
  end if;
  if exists (select 1 from public.categories where parent_id = new.id) then
    raise exception 'Esta categoria tem subcategorias.';
  end if;
  return new;
end;
$$;

drop trigger if exists categories_two_levels on public.categories;
create trigger categories_two_levels
  before insert or update of parent_id on public.categories
  for each row execute function public.categories_two_levels();

commit;
