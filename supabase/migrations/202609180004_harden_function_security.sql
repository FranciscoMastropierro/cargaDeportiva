-- Endurecimiento de funciones detectadas por Security Advisor.
alter function public.set_updated_at() set search_path = public;
alter function public.enforce_active_player_limit() set search_path = public;
alter function public.enforce_match_club_relation() set search_path = public;
alter function public.enforce_stat_club_relation() set search_path = public;
alter function public.current_club_id() set search_path = public;
alter function public.replace_match_stats(uuid, jsonb) set search_path = public;

revoke all on function public.current_club_id() from public;
revoke all on function public.replace_match_stats(uuid, jsonb) from public, anon;
-- La función solo devuelve el club de auth.uid(); para anon devuelve NULL.
-- Debe ser ejecutable por anon para que PostgreSQL pueda evaluar las políticas RLS.
grant execute on function public.current_club_id() to anon, authenticated;
grant execute on function public.replace_match_stats(uuid, jsonb) to authenticated;
