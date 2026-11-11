-- Perks level up as you fill their collection: Lv 1 at 20% caught ... Lv 5 (the full boost) at 100%.
-- Lv 0 does nothing and can't be equipped. Same integer maths as perkLevel() in src/game/perks.ts.

-- Level 0-5 of a collection for one player (p_need null = every Blip).
create function private.perk_level(p_user uuid, p_need text) returns int
language sql stable security definer set search_path = '' as $$
  select ((5 * count(u.blip_id)) / count(*))::int
  from public.blips b
  left join public.user_blips u on u.blip_id = b.id and u.user_id = p_user
  where p_need is null or b.collection = p_need
$$;
revoke all on function private.perk_level(uuid, text) from public, anon, authenticated;

create or replace function private.boost(p_user uuid, p_kind text) returns int
language sql stable security definer set search_path = '' as $$
  with l as (select loadout from public.profiles where id = p_user)
  select (coalesce((
    select sum(case p_kind when 'xp' then (array[5,8,12,20])[b.rarity] when 'catch' then (array[2,3,5,8])[b.rarity]
      when 'saver' then (array[10,15,20,30])[b.rarity] else (array[5,8,12,20])[b.rarity] end)
    from public.blips b
    where b.ability = p_kind and b.id in (select jsonb_array_elements_text(l.loadout -> 'blips') from l)
  ), 0) + coalesce((
    select sum(x.n * private.perk_level(p_user, x.need) / 5)
    from (values ('headstart', 'xp', 10, 'Originals'), ('aurafarmer', 'catch', 5, 'Brainrot'), ('packrat', 'saver', 20, 'Explorer wave'), ('plotarmour', 'finder', 15, 'Pop culture'), ('completionist', 'xp', 15, null)) x(id, kind, n, need)
    where x.kind = p_kind and x.id in (select jsonb_array_elements_text(l.loadout -> 'perks') from l)
  ), 0))::int
$$;

create or replace function public.set_loadout(p_perks text[], p_blips text[]) returns json
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  perks text[] := coalesce(p_perks, '{}');
  blips text[] := coalesce(p_blips, '{}');
  lo jsonb;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if cardinality(perks) > 2 or cardinality(blips) > 3 then raise exception 'too many'; end if;
  if (select count(distinct x) from unnest(perks) x) <> cardinality(perks)
    or (select count(distinct x) from unnest(blips) x) <> cardinality(blips) then raise exception 'duplicate'; end if;
  if exists (select 1 from unnest(blips) x where not exists (
    select 1 from public.user_blips u where u.user_id = uid and u.blip_id = x)) then raise exception 'blip not caught'; end if;
  if exists (
    select 1 from unnest(perks) x
    left join (values ('headstart', 'Originals'), ('aurafarmer', 'Brainrot'), ('packrat', 'Explorer wave'), ('plotarmour', 'Pop culture'), ('completionist', null)) p(id, need) on p.id = x
    where p.id is null or private.perk_level(uid, p.need) < 1
  ) then raise exception 'perk locked'; end if;
  lo := jsonb_build_object('perks', to_jsonb(perks), 'blips', to_jsonb(blips));
  update public.profiles set loadout = lo where id = uid;
  return lo::json;
end $$;
