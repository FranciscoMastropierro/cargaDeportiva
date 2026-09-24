-- Agrega la posición genérica Defensor sin modificar jugadores existentes.
begin;

alter table public.players drop constraint players_position_check;
alter table public.players add constraint players_position_check
  check (position in ('Arquero', 'Defensor', 'Defensor central', 'Defensor lateral', 'Mediocampista', 'Volante', 'Enganche', 'Delantero'));

create or replace function public.import_players(p_operation_id uuid, p_revision text, p_rows jsonb) returns integer
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
      or (v_row->>'position') not in ('Arquero','Defensor','Defensor central','Defensor lateral','Mediocampista','Volante','Enganche','Delantero')
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

revoke all on function public.import_players(uuid,text,jsonb) from public;
grant execute on function public.import_players(uuid,text,jsonb) to authenticated;

commit;
