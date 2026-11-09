-- BlipUp schema. Clients can only READ their own rows; every write goes through the
-- security-definer RPCs below, so catches, streaks and powerups can't be faked from the browser.
-- Catch maths mirrors src/game/catch.ts – keep both in sync.

create schema if not exists private;

create table public.blips (
  id text primary key,
  name text not null,
  rarity int not null check (rarity between 1 and 4)
);

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null default 'Blipper' check (char_length(username) between 1 and 20),
  double_bubbles int not null default 2 check (double_bubbles >= 0),
  total_reps int not null default 0,
  total_sessions int not null default 0,
  streak int not null default 0,
  best_streak int not null default 0,
  best_session int not null default 0,
  last_session_date date,
  daily_claimed_date date,
  created_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  exercise text not null default 'pushup',
  target int not null,
  reps int not null,
  rerolled boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.sessions (user_id);

create table public.encounters (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  blip_id text not null references public.blips,
  chance numeric not null,
  attempts_left int not null default 2,
  boosted boolean not null default false,
  status text not null default 'active' check (status in ('active', 'caught', 'escaped')),
  created_at timestamptz not null default now()
);
create index on public.encounters (user_id);
create index on public.encounters (session_id);

create table public.user_blips (
  user_id uuid not null references auth.users on delete cascade,
  blip_id text not null references public.blips,
  times_caught int not null default 1,
  first_caught_at timestamptz not null default now(),
  primary key (user_id, blip_id)
);

-- RLS: read own rows only. No insert/update/delete policies, except username.
alter table public.blips enable row level security;
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.encounters enable row level security;
alter table public.user_blips enable row level security;

create policy "catalog is public" on public.blips for select using (true);
create policy "read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "rename self" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "read own sessions" on public.sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy "read own encounters" on public.encounters for select to authenticated using ((select auth.uid()) = user_id);
create policy "read own blips" on public.user_blips for select to authenticated using ((select auth.uid()) = user_id);

-- Users may only change their username column.
revoke update on public.profiles from anon, authenticated;
grant update (username) on public.profiles to authenticated;

-- Auto-create a profile for every new auth user (anonymous ones included).
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- Rolls a rarity + Blip for a session and stores the encounter.
create function private.new_encounter(p_session uuid, p_user uuid, p_target int)
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
      * (0.5 + (p_target - 5) / 95.0)))
  )
  returning * into e;
  return e;
end $$;

-- Finish a pushup session: stats, streak, rewards, then the first encounter.
create function public.complete_session(p_target int, p_reps int, p_local_date date)
returns json
language plpgsql security definer set search_path = '' as $$
declare
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
    double_bubbles = double_bubbles + bonus
  where id = uid;

  insert into public.sessions (user_id, target, reps) values (uid, p_target, p_reps) returning id into s_id;
  e := private.new_encounter(s_id, uid, p_target);
  return json_build_object('encounter', row_to_json(e), 'rewards', rewards);
end $$;

create function public.attempt_catch(p_encounter uuid)
returns json
language plpgsql security definer set search_path = '' as $$
declare
  e public.encounters;
  caught boolean;
begin
  select * into e from public.encounters where id = p_encounter and user_id = auth.uid() for update;
  if not found then raise exception 'no encounter'; end if;
  if e.status <> 'active' or e.attempts_left <= 0 then raise exception 'no attempts left'; end if;

  caught := random() < (case when e.boosted then least(0.95, e.chance * 2) else e.chance end);

  update public.encounters set
    attempts_left = attempts_left - 1,
    status = case when caught then 'caught' else status end
  where id = e.id returning * into e;

  if caught then
    insert into public.user_blips (user_id, blip_id) values (e.user_id, e.blip_id)
    on conflict (user_id, blip_id) do update set times_caught = public.user_blips.times_caught + 1;
  end if;
  return json_build_object('caught', caught, 'attempts_left', e.attempts_left, 'status', e.status);
end $$;

-- After both tries fail: spend a Double Bubble for one extra try at 2x chance.
create function public.use_double_bubble(p_encounter uuid)
returns json
language plpgsql security definer set search_path = '' as $$
declare e public.encounters;
begin
  select * into e from public.encounters where id = p_encounter and user_id = auth.uid() for update;
  if not found or e.status <> 'active' or e.attempts_left > 0 or e.boosted then
    raise exception 'cannot boost this encounter';
  end if;
  update public.profiles set double_bubbles = double_bubbles - 1
  where id = auth.uid() and double_bubbles > 0;
  if not found then raise exception 'no double bubbles'; end if;
  update public.encounters set attempts_left = 1, boosted = true where id = e.id returning * into e;
  return row_to_json(e);
end $$;

-- Let it bounce: the first escape per session rerolls a new Blip, the second ends the session (returns null).
create function public.let_escape(p_encounter uuid)
returns json
language plpgsql security definer set search_path = '' as $$
declare
  e public.encounters;
  s public.sessions;
begin
  select * into e from public.encounters where id = p_encounter and user_id = auth.uid() for update;
  if not found or e.status <> 'active' or e.attempts_left > 0 then raise exception 'cannot escape now'; end if;
  update public.encounters set status = 'escaped' where id = e.id;
  select * into s from public.sessions where id = e.session_id for update;
  if s.rerolled then return null; end if;
  update public.sessions set rerolled = true where id = s.id;
  return row_to_json(private.new_encounter(s.id, s.user_id, s.target));
end $$;

revoke all on all functions in schema private from public, anon, authenticated;
revoke execute on function public.complete_session, public.attempt_catch, public.use_double_bubble, public.let_escape from public, anon;
grant execute on function public.complete_session, public.attempt_catch, public.use_double_bubble, public.let_escape to authenticated;

insert into public.blips (id, name, rarity) values
('blub','Blub',1), ('npc','NPC',1), ('lowkey','Lowkey',1), ('mewzy','Mewzy',1),
('delulu','Delulu',1), ('yapper','Yapper',1), ('bedrot','Bedrot',1), ('icky','Icky',1),
('zoomie','Zoomie',1), ('fumble','Fumble',1), ('brainrot','Brainrot',1), ('mid','Mid',1),
('rizzlet','Rizzlet',2), ('gainz','Gainz',2), ('sigma','Sigma',2), ('slay','Slay',2),
('vibez','Vibez',2), ('aura','Aura',2), ('sus','Sus',2), ('protag','Protag',2),
('nyxie','Nyxie',3), ('hyperpop','Hyperpop',3), ('drip','Drip',3), ('cottage','Cottage',3),
('clutch','Clutch',3), ('glitch','Glitch',3),
('goat','GOAT',4), ('finalboss','Final Boss',4), ('villainera','Villain Era',4), ('lore','Lore',4);
