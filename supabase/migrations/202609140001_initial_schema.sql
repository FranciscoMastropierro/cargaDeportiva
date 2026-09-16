-- Solo desarrollo: reconstruye el esquema y datos mock desde cero.
create extension if not exists "pgcrypto";

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  position text not null check (position in ('Arquero', 'Defensor central', 'Defensor lateral', 'Mediocampista', 'Volante', 'Enganche', 'Delantero')),
  physical_status text not null default 'available' check (physical_status in ('available', 'minor_issue', 'injured')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id, name)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  competition_id uuid not null references public.competitions(id),
  match_date date not null,
  opponent text not null check (char_length(trim(opponent)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.player_match_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id),
  match_id uuid not null references public.matches(id) on delete cascade,
  minutes_played integer not null check (minutes_played >= 0),
  borg integer not null check (borg between 0 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, match_id)
);

create index players_club_active_idx on public.players (club_id, active);
create index competitions_club_idx on public.competitions (club_id);
create index matches_club_date_idx on public.matches (club_id, match_date);
create index player_match_stats_match_player_idx on public.player_match_stats (match_id, player_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

create or replace function public.enforce_active_player_limit()
returns trigger language plpgsql as $$
begin
  if new.active then
    perform pg_advisory_xact_lock(hashtext(new.club_id::text));
    if (select count(*) from public.players where club_id = new.club_id and active and id is distinct from new.id) >= 50 then
      raise exception 'El club ya alcanzó el máximo de 50 jugadores activos';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.enforce_match_club_relation()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from public.competitions where id = new.competition_id and club_id = new.club_id) then
    raise exception 'La competencia no pertenece al club';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_stat_club_relation()
returns trigger language plpgsql as $$
begin
  if not exists (
    select 1 from public.players p join public.matches m on m.id = new.match_id where p.id = new.player_id and p.club_id = m.club_id
  ) then raise exception 'El jugador y el partido deben pertenecer al mismo club'; end if;
  return new;
end;
$$;

create trigger clubs_updated_at before update on public.clubs for each row execute function public.set_updated_at();
create trigger players_updated_at before update on public.players for each row execute function public.set_updated_at();
create trigger competitions_updated_at before update on public.competitions for each row execute function public.set_updated_at();
create trigger matches_updated_at before update on public.matches for each row execute function public.set_updated_at();
create trigger player_match_stats_updated_at before update on public.player_match_stats for each row execute function public.set_updated_at();
create trigger players_active_limit before insert or update of active, club_id on public.players for each row execute function public.enforce_active_player_limit();
create trigger matches_club_relation before insert or update of competition_id, club_id on public.matches for each row execute function public.enforce_match_club_relation();
create trigger stats_club_relation before insert or update of player_id, match_id on public.player_match_stats for each row execute function public.enforce_stat_club_relation();

create or replace function public.current_club_id()
returns uuid language sql stable security definer set search_path = public as $$
  select club_id from public.profiles where id = auth.uid()
$$;

create or replace function public.replace_match_stats(p_match_id uuid, p_stats jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_club_id uuid;
begin
  select club_id into v_club_id from public.matches where id = p_match_id;
  if v_club_id is null or v_club_id is distinct from public.current_club_id() then raise exception 'El partido no existe o no pertenece a tu club'; end if;
  if exists (select 1 from jsonb_to_recordset(p_stats) as item(player_id uuid, minutes_played integer, borg integer) where item.minutes_played < 0 or item.borg not between 0 and 10) then raise exception 'Minutos o Borg inválidos'; end if;
  if exists (select 1 from jsonb_to_recordset(p_stats) as item(player_id uuid, minutes_played integer, borg integer) left join public.players p on p.id = item.player_id where p.club_id is distinct from v_club_id) then raise exception 'Hay jugadores que no pertenecen al club'; end if;
  delete from public.player_match_stats where match_id = p_match_id;
  insert into public.player_match_stats (match_id, player_id, minutes_played, borg)
  select p_match_id, item.player_id, item.minutes_played, item.borg from jsonb_to_recordset(p_stats) as item(player_id uuid, minutes_played integer, borg integer);
end;
$$;

alter table public.clubs enable row level security;
alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.competitions enable row level security;
alter table public.matches enable row level security;
alter table public.player_match_stats enable row level security;

create policy "users read their profile" on public.profiles for select using (id = auth.uid());
create policy "users read their club" on public.clubs for select using (id = public.current_club_id());
create policy "club players" on public.players for all using (club_id = public.current_club_id()) with check (club_id = public.current_club_id());
create policy "club competitions" on public.competitions for all using (club_id = public.current_club_id()) with check (club_id = public.current_club_id());
create policy "club matches" on public.matches for all using (club_id = public.current_club_id()) with check (club_id = public.current_club_id());
create policy "club stats" on public.player_match_stats for all using (exists (select 1 from public.matches m where m.id = match_id and m.club_id = public.current_club_id())) with check (exists (select 1 from public.matches m where m.id = match_id and m.club_id = public.current_club_id()));
