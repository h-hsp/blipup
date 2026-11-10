-- Owner mode: typing the owner code as your username flips is_owner instead of renaming you.
-- The code itself is NOT in this repo: only its sha256 lives in private.app_config (set out-of-band).

alter table public.profiles add column is_owner boolean not null default false;
-- (users still may only update `username`; is_owner is server-written only)

create table private.app_config (key text primary key, value text not null);
revoke all on private.app_config from anon, authenticated;

create function private.require_owner() returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null or not exists (select 1 from public.profiles where id = uid and is_owner) then
    raise exception 'owner only';
  end if;
  return uid;
end $$;

-- Rename, or unlock owner mode if the name is the owner code.
create function public.set_username(p_name text) returns json
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  n text := btrim(coalesce(p_name, ''));
  code_hash text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select value into code_hash from private.app_config where key = 'owner_code_sha256';
  if code_hash is not null and encode(extensions.digest(lower(n), 'sha256'), 'hex') = code_hash then
    update public.profiles set is_owner = true where id = uid;
    insert into public.user_blips (user_id, blip_id) select uid, id from public.blips on conflict do nothing;
    return json_build_object('owner', true);
  end if;
  if char_length(n) not between 1 and 20 then raise exception 'Username must be 1-20 characters'; end if;
  update public.profiles set username = n where id = uid;
  return json_build_object('owner', false);
end $$;

-- Owner-only test commands.
create function public.owner_action(p_action text, p_blip text default null) returns json
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
        best_session = 0, last_session_date = null, daily_claimed_date = null where id = uid;
    else
      raise exception 'unknown action';
  end case;
  return json_build_object('ok', true);
end $$;

revoke execute on function public.set_username, public.owner_action, private.require_owner from public, anon;
grant execute on function public.set_username, public.owner_action to authenticated;
