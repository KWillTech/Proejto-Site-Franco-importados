-- Franco Importados: preço calculado 0 (custo 0 e margem 0) não vai para a vitrine.
-- A 0004 marcava priced só por preço não nulo; agora exige preço > 0. Margem 0 com custo > 0 continua valendo.
--
-- Rode inteiro no SQL Editor do Supabase, depois da 0004. O recálculo no fim já aplica a regra.
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
      retail_cents = coalesce(p.price, v.retail_cents),
      wholesale_cents = coalesce(p.price, v.wholesale_cents)
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
