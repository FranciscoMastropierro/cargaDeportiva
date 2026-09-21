-- Aplicar sobre instalaciones existentes.
alter table public.player_match_stats drop constraint if exists player_match_stats_minutes_played_check;
alter table public.player_match_stats add constraint player_match_stats_minutes_played_check check (minutes_played between 0 and 120);

create or replace function public.replace_match_stats(p_match_id uuid, p_stats jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_club_id uuid;
begin
  select club_id into v_club_id from public.matches where id = p_match_id;
  if v_club_id is null or v_club_id is distinct from public.current_club_id() then raise exception 'El partido no existe o no pertenece a tu club'; end if;
  if exists (select 1 from jsonb_to_recordset(p_stats) as item(player_id uuid, minutes_played integer, borg integer) where item.minutes_played not between 0 and 120 or item.borg not between 0 and 10) then raise exception 'Los minutos deben estar entre 0 y 120 y Borg entre 0 y 10'; end if;
  if exists (select 1 from jsonb_to_recordset(p_stats) as item(player_id uuid, minutes_played integer, borg integer) left join public.players p on p.id = item.player_id where p.club_id is distinct from v_club_id) then raise exception 'Hay jugadores que no pertenecen al club'; end if;
  delete from public.player_match_stats where match_id = p_match_id;
  insert into public.player_match_stats (match_id, player_id, minutes_played, borg)
  select p_match_id, item.player_id, item.minutes_played, item.borg from jsonb_to_recordset(p_stats) as item(player_id uuid, minutes_played integer, borg integer);
end;
$$;
