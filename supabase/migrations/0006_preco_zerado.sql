-- Franco Importados: variação sem preço calculado fica com R$ 0, não com o preço antigo.
-- A 0005 mantinha o valor anterior quando custo ou margem era apagado (coalesce com a própria coluna), e o painel
-- mostrava esse preço velho. Agora retail_cents e wholesale_cents = preço calculado ou 0. priced não muda.
--
-- Rode inteiro no SQL Editor do Supabase, depois da 0005. O recálculo no fim já aplica a regra.
-- Pode ser rodado de novo sem erro.

begin;

create or replace function public.recalc_prices()
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.variants v
  set priced = coalesce(p.price > 0, false),
      retail_cents = coalesce(p.price, 0),
      wholesale_cents = coalesce(p.price, 0)
  from (
    select v2.id, round(c.cost_usd_cents * s.usd_rate)::int + c.margin_cents as price
    from public.variants v2
    left join public.variant_costs c on c.variant_id = v2.id
    left join public.settings s on s.id = 1
  ) p
  where p.id = v.id;
$$;
revoke execute on function public.recalc_prices() from public, anon;
grant execute on function public.recalc_prices() to authenticated, service_role;

select public.recalc_prices();

commit;
