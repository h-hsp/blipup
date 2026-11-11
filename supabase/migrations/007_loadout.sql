-- Perks tab: a loadout of up to 2 perks (unlocked by finishing a Blipdex collection) and 3 caught Blips.
-- Each Blip has an ability; strength comes from rarity. Generated from src/game/perks.ts (perks.test.ts checks they match).
-- Bonus XP only counts for sessions after this migration.

alter table public.blips add column collection text, add column ability text;
update public.blips b set collection = v.collection, ability = v.ability from (values
('blub', 'Originals', 'xp'),
('npc', 'Brainrot', 'xp'),
('lowkey', 'Brainrot', 'catch'),
('mewzy', 'Brainrot', 'saver'),
('delulu', 'Brainrot', 'finder'),
('yapper', 'Brainrot', 'xp'),
('bedrot', 'Brainrot', 'catch'),
('icky', 'Brainrot', 'saver'),
('zoomie', 'Originals', 'catch'),
('fumble', 'Brainrot', 'finder'),
('brainrot', 'Brainrot', 'xp'),
('mid', 'Brainrot', 'catch'),
('rizzlet', 'Brainrot', 'finder'),
('gainz', 'Originals', 'saver'),
('sigma', 'Brainrot', 'xp'),
('slay', 'Brainrot', 'catch'),
('vibez', 'Brainrot', 'saver'),
('aura', 'Brainrot', 'finder'),
('sus', 'Brainrot', 'xp'),
('protag', 'Brainrot', 'catch'),
('nyxie', 'Originals', 'finder'),
('hyperpop', 'Originals', 'xp'),
('drip', 'Brainrot', 'finder'),
('cottage', 'Brainrot', 'xp'),
('clutch', 'Brainrot', 'catch'),
('glitch', 'Originals', 'catch'),
('goat', 'Brainrot', 'finder'),
('finalboss', 'Brainrot', 'xp'),
('villainera', 'Brainrot', 'catch'),
('lore', 'Brainrot', 'saver'),
('bestie', 'Brainrot', 'saver'),
('scout', 'Explorer wave', 'xp'),
('shrubby', 'Explorer wave', 'catch'),
('floaty', 'Explorer wave', 'saver'),
('shieldy', 'Explorer wave', 'finder'),
('snacky', 'Explorer wave', 'xp'),
('partyy', 'Explorer wave', 'catch'),
('gizmo', 'Explorer wave', 'saver'),
('finn', 'Explorer wave', 'finder'),
('northy', 'Explorer wave', 'xp'),
('squiddy', 'Explorer wave', 'catch'),
('splash', 'Explorer wave', 'saver'),
('speedrun', 'Brainrot', 'saver'),
('rival', 'Explorer wave', 'finder'),
('eightbit', 'Explorer wave', 'xp'),
('turbo', 'Explorer wave', 'catch'),
('puddle', 'Explorer wave', 'saver'),
('breezy', 'Explorer wave', 'finder'),
('scrapz', 'Explorer wave', 'xp'),
('honeybun', 'Explorer wave', 'catch'),
('duo', 'Explorer wave', 'saver'),
('pockets', 'Explorer wave', 'finder'),
('kelp', 'Explorer wave', 'xp'),
('ping', 'Explorer wave', 'catch'),
('boing', 'Explorer wave', 'saver'),
('parkour', 'Explorer wave', 'finder'),
('scanz', 'Explorer wave', 'xp'),
('jumpscare', 'Brainrot', 'saver'),
('dreamy', 'Explorer wave', 'catch'),
('countwobble', 'Explorer wave', 'saver'),
('antlers', 'Explorer wave', 'finder'),
('mapsy', 'Explorer wave', 'xp'),
('slam', 'Explorer wave', 'catch'),
('fancy', 'Explorer wave', 'saver'),
('chonk', 'Explorer wave', 'finder'),
('spinout', 'Explorer wave', 'xp'),
('phantom', 'Explorer wave', 'catch'),
('wishy', 'Explorer wave', 'saver'),
('capnwobble', 'Explorer wave', 'finder'),
('moonbeam', 'Explorer wave', 'xp'),
('babyblipa', 'Pop culture', 'xp'),
('blipubu', 'Pop culture', 'catch'),
('spongeblip', 'Pop culture', 'saver'),
('blipcraft', 'Pop culture', 'finder'),
('stormblipper', 'Pop culture', 'xp'),
('hedgeblip', 'Pop culture', 'catch'),
('spiderblip', 'Pop culture', 'saver'),
('batblip', 'Pop culture', 'finder'),
('superblipio', 'Pop culture', 'xp'),
('ironblip', 'Pop culture', 'catch'),
('darthblipper', 'Pop culture', 'saver'),
('blipzilla', 'Pop culture', 'finder')
) v(id, collection, ability) where b.id = v.id;

alter table public.profiles
  add column loadout jsonb not null default '{"perks":[],"blips":[]}',
  add column bonus_xp int not null default 0;

-- Total strength of one effect in a player's equipped loadout.
create function private.boost(p_user uuid, p_kind text) returns int
language sql stable security definer set search_path = '' as $$
  with l as (select loadout from public.profiles where id = p_user)
  select (coalesce((
    select sum(case p_kind when 'xp' then (array[5,8,12,20])[b.rarity] when 'catch' then (array[2,3,5,8])[b.rarity]
      when 'saver' then (array[10,15,20,30])[b.rarity] else (array[5,8,12,20])[b.rarity] end)
    from public.blips b
    where b.ability = p_kind and b.id in (select jsonb_array_elements_text(l.loadout -> 'blips') from l)
  ), 0) + coalesce((
    select sum(x.n) from (values ('headstart', 'xp', 10, 'Originals'), ('aurafarmer', 'catch', 5, 'Brainrot'), ('packrat', 'saver', 20, 'Explorer wave'), ('plotarmour', 'finder', 15, 'Pop culture'), ('completionist', 'xp', 15, null)) x(id, kind, n, need)
    where x.kind = p_kind and x.id in (select jsonb_array_elements_text(l.loadout -> 'perks') from l)
  ), 0))::int
$$;
revoke all on function private.boost(uuid, text) from public, anon, authenticated;

-- Equip a loadout: only caught Blips, only unlocked perks, no duplicates.
create function public.set_loadout(p_perks text[], p_blips text[]) returns json
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
    left join (values ('headstart', 'xp', 10, 'Originals'), ('aurafarmer', 'catch', 5, 'Brainrot'), ('packrat', 'saver', 20, 'Explorer wave'), ('plotarmour', 'finder', 15, 'Pop culture'), ('completionist', 'xp', 15, null)) p(id, kind, n, need) on p.id = x
    where p.id is null or exists (
      select 1 from public.blips b
      where (p.need is null or b.collection = p.need)
        and not exists (select 1 from public.user_blips u where u.user_id = uid and u.blip_id = b.id))
  ) then raise exception 'perk locked'; end if;
  lo := jsonb_build_object('perks', to_jsonb(perks), 'blips', to_jsonb(blips));
  update public.profiles set loadout = lo where id = uid;
  return lo::json;
end $$;
revoke execute on function public.set_loadout(text[], text[]) from public, anon;
grant execute on function public.set_loadout(text[], text[]) to authenticated;

create or replace function public.complete_session(p_target int, p_reps int, p_local_date date, p_level int default null)
returns json language plpgsql security definer set search_path = '' as $$
declare
  camp constant int[] := array[5,10,10,10,15,15,15,15,10,20,20,20,20,25,25,25,15,25,20,30,30,35,25,35,40,35,40,30,45,50,45,50,40,55,60,50,60,65,55,70,60,70,75,80,80,70,85,90,80,100];
  uid uuid := auth.uid();
  prof public.profiles;
  new_streak int;
  bonus int := 0;
  rewards text[] := '{}';
  m int;
  s_id uuid;
  e public.encounters;
  xp_pct int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_target not between 5 and 100 or p_target % 5 <> 0 then raise exception 'bad target'; end if;
  if p_reps < p_target or p_reps > 1000 then raise exception 'bad reps'; end if;
  if p_local_date not between current_date - 1 and current_date + 1 then raise exception 'bad date'; end if;

  select * into prof from public.profiles where id = uid for update;

  if p_level is not null then
    -- only the next level counts, and only with that level's own target
    if p_level <> prof.campaign_level + 1 or p_level > array_length(camp, 1) then raise exception 'bad level'; end if;
    if p_target <> camp[p_level] then raise exception 'bad target'; end if;
    if p_level % 5 = 0 then
      bonus := bonus + 1; rewards := rewards || ('campaign_' || p_level);
    end if;
  end if;

  new_streak := case
    when prof.last_session_date = p_local_date then greatest(prof.streak, 1)
    when prof.last_session_date = p_local_date - 1 then prof.streak + 1
    else 1 end;
  if new_streak <> prof.streak and (new_streak = 3 or new_streak % 7 = 0) then
    bonus := bonus + 1; rewards := rewards || ('streak_' || new_streak);
  end if;

  if p_reps >= 20 and prof.daily_claimed_date is distinct from p_local_date then
    bonus := bonus + 1; rewards := rewards || 'daily'::text;
  end if;

  foreach m in array array[100, 500, 1000, 5000] loop
    if prof.total_reps < m and prof.total_reps + p_reps >= m then
      bonus := bonus + 1; rewards := rewards || ('milestone_' || m);
    end if;
  end loop;

  -- loadout: bonus XP on this session's pushups, and a chance to find a Double Bubble
  xp_pct := private.boost(uid, 'xp');
  if random() * 100 < private.boost(uid, 'finder') then
    bonus := bonus + 1; rewards := rewards || 'finder'::text;
  end if;

  update public.profiles set
    bonus_xp = bonus_xp + floor(p_reps * 10 * xp_pct / 100.0)::int,
    total_reps = total_reps + p_reps,
    total_sessions = total_sessions + 1,
    streak = new_streak,
    best_streak = greatest(best_streak, new_streak),
    best_session = greatest(best_session, p_reps),
    last_session_date = greatest(coalesce(last_session_date, p_local_date), p_local_date),
    daily_claimed_date = case when 'daily' = any(rewards) then p_local_date else daily_claimed_date end,
    double_bubbles = double_bubbles + bonus,
    campaign_level = coalesce(p_level, campaign_level)
  where id = uid;

  insert into public.sessions (user_id, target, reps) values (uid, p_target, p_reps) returning id into s_id;
  e := private.new_encounter(s_id, uid, p_target);
  return json_build_object('encounter', row_to_json(e), 'rewards', rewards);
end $$;

create or replace function private.new_encounter(p_session uuid, p_user uuid, p_target int)
returns public.encounters
language plpgsql security definer set search_path = '' as $$
declare
  roll numeric := random() * 100;
  r int;
  b text;
  e public.encounters;
begin
  r := case
    when roll < 60 then 1
    when roll < 87 then 2
    when roll < 97 or p_target < 30 then 3
    else 4 end;
  select id into b from public.blips where rarity = r order by random() limit 1;
  insert into public.encounters (session_id, user_id, blip_id, chance)
  values (
    p_session, p_user, b,
    least(0.95, greatest(0.05,
      (case r when 1 then 0.70 when 2 then 0.50 when 3 then 0.30 else 0.15 end)
      * (0.5 + (p_target - 5) / 95.0)) + private.boost(p_user, 'catch') / 100.0)
  )
  returning * into e;
  return e;
end $$;

create or replace function public.use_double_bubble(p_encounter uuid)
returns json
language plpgsql security definer set search_path = '' as $$
declare
  e public.encounters;
  saved boolean;
begin
  select * into e from public.encounters where id = p_encounter and user_id = auth.uid() for update;
  if not found or e.status <> 'active' or e.attempts_left > 0 or e.boosted then
    raise exception 'cannot boost this encounter';
  end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and double_bubbles > 0) then raise exception 'no double bubbles'; end if;
  saved := random() * 100 < private.boost(auth.uid(), 'saver');
  if not saved then
    update public.profiles set double_bubbles = double_bubbles - 1 where id = auth.uid();
  end if;
  update public.encounters set attempts_left = 1, boosted = true where id = e.id returning * into e;
  return (to_jsonb(e) || jsonb_build_object('saved', saved))::json;
end $$;

create or replace function public.owner_action(p_action text, p_blip text default null) returns json
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := private.require_owner();
  s_id uuid;
  e public.encounters;
  r int;
begin
  case p_action
    when 'unlock_all' then
      insert into public.user_blips (user_id, blip_id) select uid, id from public.blips on conflict do nothing;
    when 'bubbles' then
      update public.profiles set double_bubbles = double_bubbles + 10 where id = uid;
    when 'reps' then
      update public.profiles set total_reps = total_reps + 100 where id = uid;
    when 'spawn' then
      select rarity into r from public.blips where id = p_blip;
      if r is null then raise exception 'unknown blip'; end if;
      insert into public.sessions (user_id, target, reps) values (uid, 100, 0) returning id into s_id;
      insert into public.encounters (session_id, user_id, blip_id, chance)
      values (s_id, uid, p_blip, least(0.95, (case r when 1 then 0.70 when 2 then 0.50 when 3 then 0.30 else 0.15 end) * 1.5))
      returning * into e;
      return row_to_json(e);
    when 'reset' then
      delete from public.user_blips where user_id = uid;
      delete from public.sessions where user_id = uid;
      update public.profiles set double_bubbles = 2, total_reps = 0, total_sessions = 0, streak = 0, best_streak = 0,
        best_session = 0, last_session_date = null, daily_claimed_date = null, campaign_level = 0,
        loadout = '{"perks":[],"blips":[]}', bonus_xp = 0 where id = uid;
    else
      raise exception 'unknown action';
  end case;
  return json_build_object('ok', true);
end $$;
