-- Campaign grows from 20 to 50 levels. The original 20 keep their order, spread out with new levels between them,
-- and The Century (100) is still the last level. The list must match src/game/campaign.ts (campaign.test.ts checks it).
-- Saved progress is a level number, so players keep their count (levels 1-2 are unchanged).

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
