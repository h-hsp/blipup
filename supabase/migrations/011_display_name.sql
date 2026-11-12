-- Display names: change any time, anyone can share one. The username stays unique (log in + add friends with it).
-- Empty display name = show the username.

alter table public.profiles add column display_name text check (char_length(display_name) between 1 and 20);

-- Renames now only go through the RPCs (they check the rules); no direct column updates.
revoke update (username) on public.profiles from authenticated;
drop policy "rename self" on public.profiles;

create function public.set_display_name(p_name text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  n text := nullif(btrim(coalesce(p_name, '')), '');
begin
  if uid is null then raise exception 'not signed in'; end if;
  if char_length(n) > 20 then raise exception 'Display names are up to 20 characters'; end if;
  -- never show the owner code on a leaderboard
  if exists (select 1 from private.app_config where key = 'owner_code_sha256'
             and value = encode(extensions.digest(lower(n), 'sha256'), 'hex')) then
    raise exception 'That name is not allowed';
  end if;
  update public.profiles set display_name = n where id = uid;
  return n;
end $$;

create or replace function public.my_friends() returns json
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  return json_build_object(
    'friends', coalesce((select json_agg(json_build_object('id', p.id, 'username', p.username, 'name', coalesce(p.display_name, p.username))
                                         order by lower(coalesce(p.display_name, p.username)))
      from public.friends f join public.profiles p on p.id = case when f.user_id = uid then f.friend_id else f.user_id end
      where f.accepted and uid in (f.user_id, f.friend_id)), '[]'),
    'incoming', coalesce((select json_agg(json_build_object('id', p.id, 'username', p.username, 'name', coalesce(p.display_name, p.username)) order by f.created_at)
      from public.friends f join public.profiles p on p.id = f.user_id where f.friend_id = uid and not f.accepted), '[]'),
    'outgoing', coalesce((select json_agg(json_build_object('id', p.id, 'username', p.username, 'name', coalesce(p.display_name, p.username)) order by f.created_at)
      from public.friends f join public.profiles p on p.id = f.friend_id where f.user_id = uid and not f.accepted), '[]'));
end $$;

create or replace function public.leaderboard(p_scope text) returns json
language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  ws timestamptz := private.week_start();
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_scope not in ('global', 'friends') then raise exception 'bad scope'; end if;
  return (
    with wk as (
      select s.user_id as id, sum(s.reps)::int as reps
      from public.sessions s where s.created_at >= ws group by s.user_id
    ), pool as (
      select p.id, p.username, coalesce(p.display_name, p.username) as name, coalesce(wk.reps, 0) as reps
      from public.profiles p left join wk on wk.id = p.id
      where case when p_scope = 'global' then wk.reps > 0 or p.id = uid
                 else p.id = uid or private.is_friend(uid, p.id) end
    ), ranked as (
      select pool.*, rank() over (order by pool.reps desc)::int as rnk from pool
    )
    select json_build_object(
      'resets_at', private.week_start(1),
      'top', coalesce((select json_agg(json_build_object('rank', r.rnk, 'username', r.username, 'name', r.name, 'reps', r.reps, 'me', r.id = uid))
                       from (select * from ranked order by rnk, lower(username) limit 50) r), '[]'),
      'me', (select json_build_object('rank', r.rnk, 'reps', r.reps) from ranked r where r.id = uid))
  );
end $$;

revoke execute on function public.set_display_name from public, anon;
grant execute on function public.set_display_name to authenticated;
