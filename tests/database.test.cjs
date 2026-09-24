const { test, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
let db;
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const admin = id(1), userA = id(2), userB = id(3), newcomer = id(4), clubA = id(10), clubB = id(11);
async function query(sql, params = []) { return (await db.query(sql, params)).rows; }
async function asUser(user) {
  await db.exec('reset role; set role authenticated;');
  await query("select set_config('request.jwt.claim.sub', $1, false)", [user]);
}
async function owner() { await db.exec('reset role'); }
async function snapshot() { return (await query('select public.player_import_snapshot() as value'))[0].value; }
async function doImport(revision, rows, operation = id(100)) {
  return (await query('select public.import_players($1,$2,$3::jsonb) as count', [operation, revision, JSON.stringify(rows)]))[0].count;
}
async function prepare(email = 'new@example.invalid', club = clubA) {
  return (await query('select public.admin_prepare_invitation($1,$2) as value', [club, email]))[0].value;
}
async function accept(invitation) { return query('select public.accept_club_invitation($1) as club', [invitation]); }

before(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz, encrypted_password text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    alter default privileges in schema public grant all on tables to anon,authenticated;
  `);
  for (const file of fs.readdirSync('supabase/migrations').filter(file => file.endsWith('.sql')).sort()) {
    // gen_random_uuid is built into PostgreSQL; no pgcrypto-dependent operation is used.
    const sql = fs.readFileSync(path.join('supabase/migrations', file), 'utf8').replace(/create extension if not exists "pgcrypto";/, '');
    await db.exec(sql);
  }
  await query("insert into auth.users(id,email,email_confirmed_at,encrypted_password) values ($1,'admin@example.invalid',now(),'test'),($2,'a@example.invalid',now(),'test'),($3,'b@example.invalid',now(),'test'),($4,'new@example.invalid',now(),'test')", [admin,userA,userB,newcomer]);
  await query("insert into public.clubs(id,name) values($1,'Club A'),($2,'Club B')", [clubA,clubB]);
  await query('insert into public.profiles(id,club_id) values($1,$2),($3,$4)', [userA,clubA,userB,clubB]);
  await query("insert into public.platform_admin(user_id,authorized_email) values($1,'admin@example.invalid')", [admin]);
});
beforeEach(async () => { await db.exec('begin'); });
afterEach(async () => { await db.exec('rollback; reset role'); });
after(async () => { await db.close(); });

test('49 + 2 falla sin inserción parcial; 49 + 1 e idempotencia', async () => {
  await query("insert into players(club_id,name,position) select $1,'Jugador '||n,'Arquero' from generate_series(1,49) n", [clubA]);
  await asUser(userA); const s = await snapshot();
  await db.exec('savepoint capacity');
  await assert.rejects(doImport(s.revision, [{ name: 'Nuevo A', position: 'Volante' }, { name: 'Nuevo B', position: 'Volante' }]), /50 jugadores/);
  await db.exec('rollback to savepoint capacity');
  assert.equal((await snapshot()).players.length, 49);
  const rows = [{ name: 'Nuevo A', position: 'Volante' }];
  assert.equal(await doImport(s.revision, rows), 1);
  assert.equal(await doImport(s.revision, rows), 1);
  assert.equal((await snapshot()).players.length, 50);
});
test('revisión desactualizada rechaza otro lote', async () => {
  await asUser(userA); const s = await snapshot();
  await doImport(s.revision, [{ name:'Uno',position:'Arquero' }]);
  await assert.rejects(doImport(s.revision,[{name:'Dos',position:'Volante'}],id(101)), /plantel cambió/);
});
test('duplicados requieren autorización explícita y las posiciones se revalidan', async () => {
  await query("insert into players(club_id,name,position) values($1,'José Pérez','Arquero')", [clubA]);
  await asUser(userA); const s = await snapshot();
  await db.exec('savepoint duplicate');
  await assert.rejects(doImport(s.revision,[{name:'  JOSÉ  PÉREZ ',position:'Volante'}]), /duplicados/);
  await db.exec('rollback to savepoint duplicate');
  assert.equal(await doImport(s.revision,[{name:'José Pérez',position:'Volante',allowDuplicate:true}]),1);
  const fresh = await snapshot();
  assert.equal(await doImport(fresh.revision,[{name:'Defensa',position:'Defensor'}],id(102)),1);
  const latest = await snapshot();
  await assert.rejects(doImport(latest.revision,[{name:'Otro',position:'Carrilero'}],id(103)), /posiciones inválidos/);
});
test('sin club no importa y RLS oculta jugadores ajenos', async () => {
  await query("insert into players(club_id,name,position) values($1,'Ajeno','Arquero')", [clubB]);
  await asUser(userA); assert.equal((await snapshot()).players.length,0); assert.equal((await query('select * from players')).length,0);
  await asUser(newcomer); await assert.rejects(snapshot(),/Club no disponible/);
});
test('borrado elimina solo jugador e historial propios, conserva partido y otro jugador', async () => {
  await query("insert into competitions(id,club_id,name) values($1,$2,'Copa')", [id(20),clubA]);
  await query("insert into matches(id,club_id,competition_id,match_date,opponent) values($1,$2,$3,'2026-09-21','Rival')", [id(21),clubA,id(20)]);
  await query("insert into players(id,club_id,name,position) values($1,$3,'Uno','Arquero'),($2,$3,'Dos','Volante')", [id(22),id(23),clubA]);
  await query('insert into player_match_stats(player_id,match_id,minutes_played,borg) values($1,$3,20,2),($2,$3,30,3)',[id(22),id(23),id(21)]);
  await asUser(userA);
  assert.equal((await query('select public.delete_player_with_history($1,true) as count',[id(22)]))[0].count,1);
  assert.equal((await query('select * from players')).length,1);
  assert.equal((await query('select * from matches')).length,1);
  assert.equal((await query('select * from player_match_stats')).length,1);
});
test('cancelar o club ajeno no borra', async () => {
  await query("insert into players(id,club_id,name,position) values($1,$2,'Ajeno','Arquero')",[id(24),clubB]);
  await asUser(userA); await db.exec('savepoint denied');
  await assert.rejects(query('select public.delete_player_with_history($1,false)',[id(24)]),/Confirmación/);
  await db.exec('rollback to savepoint denied');
  await assert.rejects(query('select public.delete_player_with_history($1,true)',[id(24)]),/no pertenece/);
  await db.exec('rollback to savepoint denied'); await owner(); assert.equal((await query('select * from players')).length,1);
});
test('usuario normal no administra ni consulta invitaciones', async () => {
  await asUser(admin); await prepare(); await asUser(userA);
  assert.equal((await query('select * from club_invitations')).length,0);
  assert.equal((await query('select public.is_platform_admin() as value'))[0].value,false);
  await assert.rejects(query("select public.admin_create_club('No permitido')"),/no autorizado/);
});
test('admin crea club, invita y aceptación repetida no duplica perfil', async () => {
  await asUser(admin); await query("select public.admin_create_club('Nuevo club')");
  const invitation=await prepare(); assert.equal(invitation.existingUser,true);
  await asUser(newcomer); await accept(invitation.id); await accept(invitation.id);
  assert.equal((await query('select club_id from profiles'))[0].club_id,clubA);
});
test('invitación a cuenta de otro club bloqueada sin traslado', async () => {
  await asUser(admin); await assert.rejects(prepare('b@example.invalid'),/pertenece a otro club/);
});
test('correo distinto y sin verificar no puede aceptar', async () => {
  await asUser(admin); const invitation=await prepare(); await asUser(userB);
  await db.exec('savepoint identity'); await assert.rejects(accept(invitation.id),/no corresponde/);
  await db.exec('rollback to savepoint identity'); await owner();
  await query('update auth.users set email_confirmed_at=null where id=$1',[newcomer]);
  await asUser(newcomer); await assert.rejects(accept(invitation.id),/Verificá/);
});
test('vencida, revocada y club inactivo bloquean la membresía', async () => {
  await asUser(admin); const invitation=await prepare(); await owner();
  await query("update club_invitations set expires_at=now()-interval '1 minute' where id=$1",[invitation.id]);
  await asUser(newcomer); await db.exec('savepoint validity'); await assert.rejects(accept(invitation.id),/venció/);
  await db.exec('rollback to savepoint validity'); await owner();
  await query("update club_invitations set expires_at=now()+interval '1 day',status='revoked' where id=$1",[invitation.id]);
  await asUser(newcomer); await assert.rejects(accept(invitation.id),/revocada/);
  await db.exec('rollback to savepoint validity'); await owner();
  await query("update club_invitations set expires_at=now()+interval '1 day' where id=$1",[invitation.id]);
  await query('update clubs set active=false where id=$1',[clubA]);
  await asUser(newcomer); await assert.rejects(accept(invitation.id),/no está activo/);
});

test('misma clave con otro contenido falla y no vuelve a insertar', async () => {
  await asUser(userA); const s=await snapshot();
  await doImport(s.revision,[{name:'Uno',position:'Arquero'}]);
  await assert.rejects(doImport(s.revision,[{name:'Dos',position:'Volante'}]),/otro lote/);
});
test('homónimos dentro del lote se bloquean aunque no existan en el plantel', async () => {
  await asUser(userA); const s=await snapshot();
  await assert.rejects(doImport(s.revision,[{name:'Uno',position:'Arquero'},{name:'UNO',position:'Volante'}]),/duplicados/);
});
test('editar o desactivar después de la vista previa exige nueva revisión', async () => {
  await query("insert into players(id,club_id,name,position) values($1,$2,'Uno','Arquero')",[id(30),clubA]);
  await asUser(userA); const s=await snapshot();
  await query("update players set name='Nombre corregido', active=false where id=$1",[id(30)]);
  await assert.rejects(doImport(s.revision,[{name:'Dos',position:'Volante'}]),/plantel cambió/);
});
test('correo fallido no crea membresía; reenvío invalida la invitación anterior', async () => {
  await asUser(admin); const first=await prepare();
  await query('select public.admin_mark_invitation_delivery($1,false)',[first.id]);
  await owner();
  assert.equal((await query('select * from profiles where id=$1',[newcomer])).length,0);
  assert.equal((await query('select delivery_status from club_invitations where id=$1',[first.id]))[0].delivery_status,'failed');
  await query("update club_invitations set created_at=now()-interval '2 minutes' where id=$1",[first.id]);
  await asUser(admin); const second=await prepare();
  assert.notEqual(first.id,second.id);
  await asUser(newcomer); await db.exec('savepoint resend');
  await assert.rejects(accept(first.id),/revocada/);
  await db.exec('rollback to savepoint resend'); await accept(second.id);
});
test('cuenta sin contraseña debe definirla antes de aceptar', async () => {
  await query("update auth.users set encrypted_password='' where id=$1",[newcomer]);
  await asUser(admin); const invitation=await prepare(); await asUser(newcomer);
  const info=(await query('select public.my_invitation($1) as value',[invitation.id]))[0].value;
  assert.equal(info.needsPassword,true);
  await assert.rejects(accept(invitation.id),/Definí tu contraseña/);
});
test('revocar autorización al emisor impide nuevas aceptaciones', async () => {
  await asUser(admin); const invitation=await prepare(); await owner();
  await query("update auth.users set email='changed@example.invalid' where id=$1",[admin]);
  await asUser(admin); assert.equal((await query('select public.is_platform_admin() as value'))[0].value,false);
  await asUser(newcomer); await assert.rejects(accept(invitation.id),/no está autorizada/);
});
test('sin sesión no hay RPC de borrado/importación y no se puede autoconceder administración', async () => {
  await asUser(userA); await db.exec('savepoint elevation');
  await assert.rejects(query("insert into platform_admin(user_id,authorized_email) values($1,'a@example.invalid')",[userA]),/permission denied/);
  await db.exec('rollback to savepoint elevation'); await db.exec('reset role; set role anon');
  await assert.rejects(query('select public.player_import_snapshot()'),/permission denied/);
});
