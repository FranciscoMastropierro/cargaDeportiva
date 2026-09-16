-- Datos mock para desarrollo. Crear usuarios en Supabase Auth y asociarlos a
-- su club en public.profiles antes de iniciar sesión.
insert into public.clubs (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Club Deportivo Norte'),
  ('22222222-2222-2222-2222-222222222222', 'Club Atlético Sur');

insert into public.competitions (club_id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Torneo Federal'),
  ('11111111-1111-1111-1111-111111111111', 'Torneo local 1ra'),
  ('11111111-1111-1111-1111-111111111111', 'Torneo local reserva'),
  ('22222222-2222-2222-2222-222222222222', 'Torneo Federal'),
  ('22222222-2222-2222-2222-222222222222', 'Torneo local 1ra'),
  ('22222222-2222-2222-2222-222222222222', 'Torneo local reserva');

insert into public.players (club_id, name, position, physical_status) values
  ('11111111-1111-1111-1111-111111111111', 'Juan Pérez', 'Arquero', 'available'),
  ('11111111-1111-1111-1111-111111111111', 'Pedro Gómez', 'Defensor central', 'minor_issue'),
  ('11111111-1111-1111-1111-111111111111', 'Lucas Díaz', 'Defensor lateral', 'available'),
  ('11111111-1111-1111-1111-111111111111', 'Martín Silva', 'Mediocampista', 'available'),
  ('11111111-1111-1111-1111-111111111111', 'Tomás Ruiz', 'Volante', 'injured'),
  ('11111111-1111-1111-1111-111111111111', 'Nicolás Torres', 'Enganche', 'available'),
  ('11111111-1111-1111-1111-111111111111', 'Santiago López', 'Delantero', 'available'),
  ('22222222-2222-2222-2222-222222222222', 'Matías Acosta', 'Arquero', 'available');

insert into public.matches (club_id, competition_id, match_date, opponent)
select c.club_id, c.id, sample.match_date, sample.opponent from public.competitions c cross join (values
  ('2026-09-02'::date, 'Atlético Sur'), ('2026-09-07'::date, 'Club Central'), ('2026-09-10'::date, 'Deportivo Norte'), ('2026-09-14'::date, 'Unión')
) as sample(match_date, opponent)
where c.club_id = '11111111-1111-1111-1111-111111111111' and c.name = 'Torneo Federal';

insert into public.player_match_stats (player_id, match_id, minutes_played, borg)
select p.id, m.id, 55 + ((row_number() over (partition by m.id order by p.name)::integer * 6) % 36), 4 + ((row_number() over (partition by m.id order by p.name)::integer + extract(day from m.match_date)::integer) % 5)
from public.players p cross join public.matches m
where p.club_id = m.club_id and p.club_id = '11111111-1111-1111-1111-111111111111' and p.name in ('Juan Pérez', 'Pedro Gómez', 'Lucas Díaz', 'Martín Silva', 'Nicolás Torres', 'Santiago López');
