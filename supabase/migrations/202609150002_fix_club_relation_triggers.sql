-- Reparación para una instancia donde ya se ejecutó la migración inicial anterior.
drop trigger if exists matches_club_relation on public.matches;
drop trigger if exists stats_club_relation on public.player_match_stats;
drop function if exists public.enforce_club_relations();

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
    select 1 from public.players p join public.matches m on m.id = new.match_id
    where p.id = new.player_id and p.club_id = m.club_id
  ) then raise exception 'El jugador y el partido deben pertenecer al mismo club'; end if;
  return new;
end;
$$;

create trigger matches_club_relation before insert or update of competition_id, club_id on public.matches
for each row execute function public.enforce_match_club_relation();
create trigger stats_club_relation before insert or update of player_id, match_id on public.player_match_stats
for each row execute function public.enforce_stat_club_relation();
