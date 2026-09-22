-- Ejecutar una sola vez DESPUÉS de 006, con la cuenta ya existente y correo verificado.
-- No crea usuarios ni cambia su club. No permite sustituir a un administrador existente.
do $$
declare v_id uuid;
begin
  select id into strict v_id from auth.users
    where lower(email)='mastropierro.francisco@gmail.com' and email_confirmed_at is not null;
  if exists(select 1 from public.platform_admin where user_id<>v_id) then
    raise exception 'Ya existe otro administrador. Revisar manualmente.';
  end if;
  insert into public.platform_admin(singleton,user_id,authorized_email)
    values(true,v_id,'mastropierro.francisco@gmail.com') on conflict(singleton) do nothing;
end;
$$;
