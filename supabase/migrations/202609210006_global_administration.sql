begin;
create table public.platform_admin (
  singleton boolean primary key default true check(singleton),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  authorized_email text not null
);
alter table public.platform_admin enable row level security;
revoke all on public.platform_admin from anon, authenticated;

create function public.is_platform_admin() returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.platform_admin a join auth.users u on u.id=a.user_id
    where a.user_id=auth.uid() and lower(u.email)=a.authorized_email and u.email_confirmed_at is not null)
$$;
revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;

create policy "platform admin reads clubs" on public.clubs for select to authenticated using(public.is_platform_admin());

create table public.club_invitations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id),
  email text not null check(email=lower(trim(email))),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default(now()+interval '72 hours'),
  status text not null default 'pending' check(status in ('pending','accepted','revoked')),
  delivery_status text not null default 'pending' check(delivery_status in ('pending','sent','failed')),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz
);
create unique index club_invitations_pending_email on public.club_invitations(email) where status='pending';
alter table public.club_invitations enable row level security;
revoke all on public.club_invitations from anon, authenticated;
grant select on public.club_invitations to authenticated;
create policy "platform admin reads invitations" on public.club_invitations for select to authenticated using(public.is_platform_admin());

create function public.admin_create_club(p_name text) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  if not public.is_platform_admin() then raise exception 'Acceso no autorizado.'; end if;
  if p_name is null or length(trim(p_name)) not between 1 and 150 then raise exception 'Ingresá un nombre de club válido.'; end if;
  insert into public.clubs(name) values(trim(p_name)) returning id into v_id;
  return v_id;
end;
$$;

create function public.admin_prepare_invitation(p_club_id uuid,p_email text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare v_email text:=lower(trim(p_email)); v_user uuid; v_club uuid; v_id uuid;
begin
  if not public.is_platform_admin() then raise exception 'Acceso no autorizado.'; end if;
  if v_email is null or length(v_email)>254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Ingresá un correo válido.'; end if;
  perform pg_advisory_xact_lock(hashtext('invite:'||v_email));
  if not exists(select 1 from public.clubs where id=p_club_id and active) then raise exception 'El club no está activo.'; end if;
  select id into v_user from auth.users where lower(email)=v_email;
  select club_id into v_club from public.profiles where id=v_user;
  if v_club is not null then
    if v_club<>p_club_id then raise exception 'Ese correo pertenece a otro club. No se modificó su cuenta.'; end if;
    raise exception 'Ese usuario ya pertenece al club.';
  end if;
  if exists(select 1 from public.club_invitations where email=v_email and created_at>now()-interval '60 seconds') then
    raise exception 'Esperá un minuto antes de reenviar la invitación.';
  end if;
  update public.club_invitations set status='revoked' where email=v_email and status='pending';
  insert into public.club_invitations(club_id,email,created_by) values(p_club_id,v_email,auth.uid()) returning id into v_id;
  return jsonb_build_object('id',v_id,'email',v_email,'existingUser',v_user is not null);
end;
$$;

create function public.admin_mark_invitation_delivery(p_id uuid,p_sent boolean) returns void
language plpgsql security definer set search_path=public as $$
begin
  if not public.is_platform_admin() then raise exception 'Acceso no autorizado.'; end if;
  update public.club_invitations set delivery_status=case when p_sent then 'sent' else 'failed' end where id=p_id and status='pending';
end;
$$;

create function public.admin_revoke_invitation(p_id uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
  if not public.is_platform_admin() then raise exception 'Acceso no autorizado.'; end if;
  update public.club_invitations set status='revoked' where id=p_id and status='pending';
end;
$$;

create function public.my_invitation(p_id uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare v_result jsonb;
begin
  select jsonb_build_object('id',i.id,'clubName',c.name,'status',i.status,'expiresAt',i.expires_at,
    'valid',i.status='pending' and i.expires_at>now() and c.active,
    'needsPassword',coalesce(u.encrypted_password,'')='') into v_result
  from public.club_invitations i join public.clubs c on c.id=i.club_id join auth.users u on u.id=auth.uid()
  where i.id=p_id and i.email=lower(u.email) and u.email_confirmed_at is not null;
  if v_result is null then raise exception 'La invitación no está disponible para esta cuenta.'; end if;
  return v_result;
end;
$$;

create function public.accept_club_invitation(p_id uuid) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_user auth.users%rowtype; v_inv public.club_invitations%rowtype; v_club uuid;
begin
  select * into v_user from auth.users where id=auth.uid();
  if v_user.id is null or v_user.email_confirmed_at is null then raise exception 'Verificá tu correo antes de aceptar.'; end if;
  perform pg_advisory_xact_lock(hashtext('invite:'||lower(v_user.email)));
  select * into v_inv from public.club_invitations where id=p_id for update;
  if v_inv.id is null or v_inv.email<>lower(v_user.email) then raise exception 'La invitación no corresponde a tu cuenta.'; end if;
  select club_id into v_club from public.profiles where id=v_user.id;
  if v_inv.status='accepted' and v_inv.accepted_by=v_user.id and v_club=v_inv.club_id then return v_club; end if;
  if v_inv.status<>'pending' or v_inv.expires_at<=now() then raise exception 'La invitación venció o fue revocada.'; end if;
  if not exists(select 1 from public.platform_admin a join auth.users u on u.id=a.user_id
    where a.user_id=v_inv.created_by and lower(u.email)=a.authorized_email and u.email_confirmed_at is not null) then
    raise exception 'La invitación ya no está autorizada.';
  end if;
  perform 1 from public.clubs where id=v_inv.club_id and active for share;
  if not found then raise exception 'El club no está activo.'; end if;
  if v_club is not null and v_club<>v_inv.club_id then raise exception 'Tu cuenta ya pertenece a otro club.'; end if;
  if coalesce(v_user.encrypted_password,'')='' then raise exception 'Definí tu contraseña antes de aceptar.'; end if;
  insert into public.profiles(id,club_id) values(v_user.id,v_inv.club_id) on conflict(id) do nothing;
  select club_id into v_club from public.profiles where id=v_user.id;
  if v_club<>v_inv.club_id then raise exception 'Tu cuenta ya pertenece a otro club.'; end if;
  update public.club_invitations set status='accepted',accepted_by=v_user.id,accepted_at=now() where id=p_id;
  return v_club;
end;
$$;

revoke all on function public.admin_create_club(text) from public;
revoke all on function public.admin_prepare_invitation(uuid,text) from public;
revoke all on function public.admin_mark_invitation_delivery(uuid,boolean) from public;
revoke all on function public.admin_revoke_invitation(uuid) from public;
revoke all on function public.my_invitation(uuid) from public;
revoke all on function public.accept_club_invitation(uuid) from public;
grant execute on function public.admin_create_club(text) to authenticated;
grant execute on function public.admin_prepare_invitation(uuid,text) to authenticated;
grant execute on function public.admin_mark_invitation_delivery(uuid,boolean) to authenticated;
grant execute on function public.admin_revoke_invitation(uuid) to authenticated;
grant execute on function public.my_invitation(uuid) to authenticated;
grant execute on function public.accept_club_invitation(uuid) to authenticated;
commit;
