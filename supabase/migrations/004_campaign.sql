-- Campaign: 20 levels, each with its own pushup requirement. Cleared in order, one at a time.
-- The level list below must match src/game/campaign.ts (campaign.test.ts checks it).

alter table public.profiles add column campaign_level int not null default 0;

drop function public.complete_session(int, int, date);

create function public.complete_session(p_target int, p_reps int, p_local_date date, p_level int default null)
returns json language plpgsql security definer set search_path = '' as $$
declare
  camp constant int[] := array[5,10,10,15,20,15,20,25,20,30,30,35,40,35,50,45,60,70,60,100];
  uid uuid := auth.uid();
  prof public.profiles;
  new_streak int;
  bonus int := 0;
  rewards text[] := '{}';
  m int;
  s_id uuid;
  e public.encounters;
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

  update public.profiles set
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

revoke execute on function public.complete_session(int, int, date, int) from public, anon;
grant execute on function public.complete_session(int, int, date, int) to authenticated;

-- Owner reset also clears campaign progress.
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
        best_session = 0, last_session_date = null, daily_claimed_date = null, campaign_level = 0 where id = uid;
    else
      raise exception 'unknown action';
  end case;
  return json_build_object('ok', true);
end $$;
