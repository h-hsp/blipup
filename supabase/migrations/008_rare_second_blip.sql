-- After you let a Blip bounce, a second Blip only shows up 5% of the time (was: always, once per session).
-- Still at most one second Blip per session.
create or replace function public.let_escape(p_encounter uuid)
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
  if s.rerolled or random() >= 0.05 then return null; end if;
  update public.sessions set rerolled = true where id = s.id;
  return row_to_json(private.new_encounter(s.id, s.user_id, s.target));
end $$;
