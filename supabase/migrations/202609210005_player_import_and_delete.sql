-- Incremental. No carga jugadores ni modifica datos existentes.
begin;

-- Also serialize edits/deactivations/deletions with the preview/commit boundary.
create function public.serialize_player_changes() returns trigger
language plpgsql set search_path=public as $$
begin
  if tg_op='DELETE' then
    perform pg_advisory_xact_lock(hashtext(old.club_id::text));
    return old;
  end if;
  perform pg_advisory_xact_lock(hashtext(new.club_id::text));
  return new;
end;
$$;
revoke all on function public.serialize_player_changes() from public;
create trigger players_serialize_changes before insert or update or delete on public.players
  for each row execute function public.serialize_player_changes();

create table public.player_import_operations (
  club_id uuid not null references public.clubs(id) on delete cascade,
  operation_id uuid not null,
  request_hash text not null,
  created_count integer not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (club_id, operation_id)
);
alter table public.player_import_operations enable row level security;
revoke all on public.player_import_operations from anon, authenticated;

create function public.player_name_key(p_name text) returns text
language sql immutable set search_path = public as $$
  select lower(trim(regexp_replace(normalize(p_name, NFC), '[[:space:]]+', ' ', 'g')))
$$;

create function public.player_import_snapshot() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_club uuid; v_players jsonb; v_name text;
begin
  v_club := public.current_club_id();
  select name into v_name from public.clubs where id = v_club and active;
  if auth.uid() is null or v_name is null then raise exception 'Club no disponible.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'position', position,
    'active', active, 'physical_status', physical_status, 'updated_at', updated_at) order by id), '[]'::jsonb)
    into v_players from public.players where club_id = v_club;
  return jsonb_build_object('clubName', v_name, 'players', v_players, 'revision', md5(v_players::text));
end;
$$;

create function public.import_players(p_operation_id uuid, p_revision text, p_rows jsonb) returns integer
language plpgsql security definer set search_path = public as $$
declare v_club uuid; v_snapshot jsonb; v_hash text; v_previous public.player_import_operations%rowtype;
  v_count integer; v_active integer; v_row jsonb; v_key text;
begin
  v_club := public.current_club_id();
  if auth.uid() is null or v_club is null or not exists(select 1 from public.clubs where id=v_club and active) then
    raise exception 'Club no disponible.';
  end if;
  if p_operation_id is null or p_revision is null or jsonb_typeof(p_rows) is distinct from 'array' then raise exception 'Lote inválido.'; end if;
  v_count := jsonb_array_length(p_rows);
  if v_count < 1 or v_count > 50 or octet_length(p_rows::text) > 1048576 then raise exception 'Seleccioná entre 1 y 50 jugadores.'; end if;
  perform pg_advisory_xact_lock(hashtext(v_club::text));
  v_hash := md5(p_revision || p_rows::text);
  select * into v_previous from public.player_import_operations where club_id=v_club and operation_id=p_operation_id;
  if found then
    if v_previous.request_hash <> v_hash then raise exception 'La operación ya fue usada con otro lote.'; end if;
    return v_previous.created_count;
  end if;
  v_snapshot := public.player_import_snapshot();
  if v_snapshot->>'revision' <> p_revision then raise exception 'El plantel cambió. Volvé a revisar el archivo.'; end if;
  select count(*) into v_active from public.players where club_id=v_club and active;
  if v_active + v_count > 50 then raise exception 'El lote supera el máximo de 50 jugadores activos.'; end if;
  for v_row in select value from jsonb_array_elements(p_rows) loop
    if jsonb_typeof(v_row->'name') is distinct from 'string' or nullif(trim(v_row->>'name'), '') is null
      or jsonb_typeof(v_row->'position') is distinct from 'string'
      or (v_row->>'position') not in ('Arquero','Defensor central','Defensor lateral','Mediocampista','Volante','Enganche','Delantero')
      or (v_row ? 'allowDuplicate' and jsonb_typeof(v_row->'allowDuplicate') <> 'boolean') then
      raise exception 'Hay nombres o posiciones inválidos.';
    end if;
    v_key := public.player_name_key(v_row->>'name');
    if not coalesce((v_row->>'allowDuplicate')::boolean, false) and (
      exists(select 1 from public.players where club_id=v_club and public.player_name_key(name)=v_key)
      or (select count(*) from jsonb_array_elements(p_rows) x where public.player_name_key(x->>'name')=v_key) > 1
    ) then raise exception 'Hay posibles duplicados sin confirmar. Volvé a revisar el archivo.'; end if;
  end loop;
  insert into public.players(club_id,name,position,active,physical_status)
    select v_club, trim(x->>'name'), x->>'position', true, 'available' from jsonb_array_elements(p_rows) x;
  insert into public.player_import_operations(club_id,operation_id,request_hash,created_count,created_by)
    values(v_club,p_operation_id,v_hash,v_count,auth.uid());
  return v_count;
end;
$$;

create function public.delete_player_with_history(p_player_id uuid, p_confirm boolean) returns integer
language plpgsql security definer set search_path = public as $$
declare v_club uuid; v_player uuid; v_deleted integer;
begin
  v_club := public.current_club_id();
  if auth.uid() is null or v_club is null or p_confirm is distinct from true then raise exception 'Confirmación y sesión requeridas.'; end if;
  perform pg_advisory_xact_lock(hashtext(v_club::text));
  select id into v_player from public.players where id=p_player_id and club_id=v_club for update;
  if v_player is null then raise exception 'El jugador no existe o no pertenece a tu club.'; end if;
  if exists(select 1 from public.player_match_stats s join public.matches m on m.id=s.match_id where s.player_id=v_player and m.club_id<>v_club) then
    raise exception 'Hay registros inconsistentes. Contactá al administrador.';
  end if;
  delete from public.player_match_stats where player_id=v_player;
  get diagnostics v_deleted = row_count;
  delete from public.players where id=v_player and club_id=v_club;
  if not found then raise exception 'No se pudo eliminar el jugador.'; end if;
  return v_deleted;
end;
$$;

revoke all on function public.player_name_key(text) from public;
revoke all on function public.player_import_snapshot() from public;
revoke all on function public.import_players(uuid,text,jsonb) from public;
revoke all on function public.delete_player_with_history(uuid,boolean) from public;
grant execute on function public.player_import_snapshot() to authenticated;
grant execute on function public.import_players(uuid,text,jsonb) to authenticated;
grant execute on function public.delete_player_with_history(uuid,boolean) to authenticated;
commit;
