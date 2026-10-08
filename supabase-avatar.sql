-- Аватар үшін: Supabase → SQL Editor → New query → осыны қойып, Run басыңыз.
-- Бұл profiles кестесіне avatar бағанын қосады және рейтингке аватарды қосады.

alter table public.profiles add column if not exists avatar text;

drop function if exists public.leaderboard();

create function public.leaderboard()
returns table (username text, points integer, streak integer, completed_lessons jsonb, avatar text)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(nullif(trim(p.username), ''), 'Қонақ')::text,
    coalesce(p.points, 0)::integer,
    coalesce(p.streak, 0)::integer,
    coalesce(to_jsonb(p.completed_lessons), '[]'::jsonb),
    p.avatar
  from public.profiles p
  order by coalesce(p.points, 0) desc, coalesce(p.streak, 0) desc
  limit 20;
$$;

revoke all on function public.leaderboard() from public;
grant execute on function public.leaderboard() to authenticated;
