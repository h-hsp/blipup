-- Social: unique usernames (you log in with them), friends, and a weekly pushup leaderboard
-- that resets every Sunday at midnight, Melbourne time (one clock for everyone, so the global board is fair).
-- Friends and boards only go through the RPCs below; the friends table has RLS on and no policies.

-- 1. Usernames are unique, ignoring case. Existing duplicates get a number; the owner, then real accounts, keep theirs.
do $$
declare r record; n text;
begin
  for r in
    select d.id, d.username from (
      select p.id, p.username, row_number() over (partition by lower(p.username)
        order by p.is_owner desc, u.is_anonymous, p.created_at) as rn
      from public.profiles p join auth.users u on u.id = p.id) d
    where d.rn > 1
  loop
    loop
      n := left(r.username, 15) || (1000 + floor(random() * 9000))::int;
      exit when not exists (select 1 from public.profiles where lower(username) = lower(n));
    end loop;
    update public.profiles set username = n where id = r.id;
  end loop;
end $$;

create unique index profiles_username_lower on public.profiles (lower(username));

-- New players get a numbered name until they pick their own.
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare n text;
begin
  loop
    n := 'Blipper' || (1000 + floor(random() * 90000))::int;
    exit when not exists (select 1 from public.profiles where lower(username) = lower(n));
  end loop;
  insert into public.profiles (id, username) values (new.id, n);
  return new;
end $$;

-- Rules for a username someone picks. Never the owner code (it would show on the leaderboard).
create function private.check_username(p_name text, p_self uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare n text := btrim(coalesce(p_name, ''));
begin
  if n !~ '^[A-Za-z0-9_.]{3,20}$' then raise exception 'Usernames are 3-20 letters, numbers, _ or .'; end if;
  if exists (select 1 from private.app_config where key = 'owner_code_sha256'
             and value = encode(extensions.digest(lower(n), 'sha256'), 'hex')) then
    raise exception 'That username is not allowed';
  end if;
  if exists (select 1 from public.profiles where lower(username) = lower(n) and id is distinct from p_self) then
    raise exception 'That username is taken';
  end if;
  return n;
end $$;

-- Rename (unchanged owner-code behaviour), now with the username rules.
create or replace function public.set_username(p_name text) returns json
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
  n := private.check_username(n, uid);
  update public.profiles set username = n where id = uid;
  return json_build_object('owner', false);
end $$;

-- Used only by the `account` edge function (service role): claim a name, and find a player by name to log in.
create function public.claim_username(p_user uuid, p_name text) returns text
language plpgsql security definer set search_path = '' as $$
declare n text := private.check_username(p_name, p_user);
begin
  update public.profiles set username = n where id = p_user;
  return n;
end $$;

create function public.user_by_name(p_name text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.profiles where lower(username) = lower(btrim(p_name))
$$;

-- 2. Friends. One row per pair: user_id asked friend_id; accepted once they say yes.
create table public.friends (
  user_id uuid not null references auth.users on delete cascade,
  friend_id uuid not null references auth.users on delete cascade,
  accepted boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
create unique index friends_pair on public.friends (least(user_id, friend_id), greatest(user_id, friend_id));
create index on public.friends (friend_id);
alter table public.friends enable row level security;

create function private.is_friend(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.friends f where f.accepted
    and ((f.user_id = a and f.friend_id = b) or (f.user_id = b and f.friend_id = a)))
$$;

create function public.add_friend(p_name text) returns json
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  f uuid;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select id into f from public.profiles where lower(username) = lower(btrim(coalesce(p_name, '')));
  if f is null then raise exception 'No player called %', btrim(coalesce(p_name, '')); end if;
  if f = uid then raise exception 'That''s you!'; end if;
  -- they already asked you: that's a yes
  update public.friends set accepted = true where user_id = f and friend_id = uid;
  if found then return json_build_object('status', 'friends'); end if;
  if exists (select 1 from public.friends where user_id = uid and friend_id = f) then
    return json_build_object('status', case when private.is_friend(uid, f) then 'friends' else 'sent' end);
  end if;
  if (select count(*) from public.friends where user_id = uid and not accepted) >= 50 then
    raise exception 'Too many requests waiting. Wait for some to answer.';
  end if;
  insert into public.friends (user_id, friend_id) values (uid, f);
  return json_build_object('status', 'sent');
end $$;

create function public.answer_friend(p_user uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_accept then
    update public.friends set accepted = true where user_id = p_user and friend_id = uid;
  else
    delete from public.friends where user_id = p_user and friend_id = uid and not accepted;
  end if;
end $$;

-- Unfriend, or cancel a request you sent.
create function public.remove_friend(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from public.friends where (user_id = uid and friend_id = p_user) or (user_id = p_user and friend_id = uid);
end $$;

create function public.my_friends() returns json
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  return json_build_object(
    'friends', coalesce((select json_agg(json_build_object('id', p.id, 'username', p.username) order by lower(p.username))
      from public.friends f join public.profiles p on p.id = case when f.user_id = uid then f.friend_id else f.user_id end
      where f.accepted and uid in (f.user_id, f.friend_id)), '[]'),
    'incoming', coalesce((select json_agg(json_build_object('id', p.id, 'username', p.username) order by f.created_at)
      from public.friends f join public.profiles p on p.id = f.user_id where f.friend_id = uid and not f.accepted), '[]'),
    'outgoing', coalesce((select json_agg(json_build_object('id', p.id, 'username', p.username) order by f.created_at)
      from public.friends f join public.profiles p on p.id = f.friend_id where f.user_id = uid and not f.accepted), '[]'));
end $$;

-- 3. Weekly leaderboard. A week starts Sunday 00:00 in Melbourne (daylight saving handled by the time zone).
-- p_weeks = 1 gives next Sunday, when the board resets.
create function private.week_start(p_weeks int default 0) returns timestamptz
language sql stable set search_path = '' as $$
  select (date_trunc('week', (now() at time zone 'Australia/Melbourne') + interval '1 day') - interval '1 day'
          + make_interval(days => 7 * p_weeks)) at time zone 'Australia/Melbourne'
$$;

create index sessions_created_at on public.sessions (created_at);

-- Top 50 by pushups this week, plus your own rank. Friends board = you and your friends (even on 0).
-- shortcut: sums the week's sessions on every call, fine for thousands of players; keep a weekly total column past that.
create function public.leaderboard(p_scope text) returns json
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
      select p.id, p.username, coalesce(wk.reps, 0) as reps
      from public.profiles p left join wk on wk.id = p.id
      where case when p_scope = 'global' then wk.reps > 0 or p.id = uid
                 else p.id = uid or private.is_friend(uid, p.id) end
    ), ranked as (
      select pool.*, rank() over (order by pool.reps desc)::int as rnk from pool
    )
    select json_build_object(
      'resets_at', private.week_start(1),
      'top', coalesce((select json_agg(json_build_object('rank', r.rnk, 'username', r.username, 'reps', r.reps, 'me', r.id = uid)
                                order by r.rnk, lower(r.username))
                       from (select * from ranked order by rnk, lower(username) limit 50) r), '[]'),
      'me', (select json_build_object('rank', r.rnk, 'reps', r.reps) from ranked r where r.id = uid))
  );
end $$;

revoke all on function private.check_username, private.is_friend, private.week_start from public, anon, authenticated;
revoke execute on function public.claim_username, public.user_by_name from public, anon, authenticated;
grant execute on function public.claim_username, public.user_by_name to service_role;
revoke execute on function public.add_friend, public.answer_friend, public.remove_friend, public.my_friends, public.leaderboard from public, anon;
grant execute on function public.add_friend, public.answer_friend, public.remove_friend, public.my_friends, public.leaderboard to authenticated;
