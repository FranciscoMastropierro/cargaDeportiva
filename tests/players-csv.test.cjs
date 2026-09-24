const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');
const { parsePlayerCsv, analyzePlayers, nameKey } = load('src/lib/imports/players.ts');
const { safeAuthDestination } = load('src/lib/auth-destinations.ts');

test('CSV BOM, separadores, comillas escapadas y saltos de línea', () => {
  const csv = parsePlayerCsv('\uFEFFnombre;posicion\r\n"Pérez, \"\"Pepe\"\"";arquero\r\n"Nombre\nApellido";VOLANTE');
  const rows = analyzePlayers(csv, 0, 1, []);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].name, 'Pérez, "Pepe"');
  assert.equal(rows[0].position, 'Arquero');
  assert.equal(rows[1].name, 'Nombre Apellido');
  assert.equal(rows[1].position, 'Volante');
  assert.equal(rows[0].error, '');
  assert.equal(parsePlayerCsv('nombre,posicion\nUno,Arquero').rows.length, 1);
});
test('límites, comillas inválidas, columnas y posiciones válidas', () => {
  assert.throws(() => parsePlayerCsv('x'.repeat(1048577)), /1 MiB/);
  assert.throws(() => parsePlayerCsv('nombre,posicion\n' + 'Uno,Arquero\n'.repeat(501)), /500/);
  assert.throws(() => parsePlayerCsv('nombre,posicion\n"Uno,Arquero'), /comillas/);
  const csv = parsePlayerCsv('nombre,posicion\nUno,Carrilero\nDos,Arquero,Extra\n,Volante');
  let rows = analyzePlayers(csv, 0, 1, []);
  assert.match(rows[0].error, /posición/);
  assert.match(rows[1].error, /columnas/);
  assert.match(rows[2].error, /nombre/);
  rows = analyzePlayers(csv, 0, 1, [], { 0: 'Defensor central' });
  assert.equal(rows[0].error, '');
  assert.equal(analyzePlayers(parsePlayerCsv('nombre,posicion\nUno,Defensor'), 0, 1, [])[0].error, '');
  assert.match(analyzePlayers(csv, 0, 0, [])[0].error, /distintas/);
});
test('homónimos con distinta posición e inactivos siguen siendo posibles duplicados', () => {
  const csv = parsePlayerCsv('nombre,posicion\nJosé  Pérez,Arquero\nJOSÉ PÉREZ,Volante');
  const rows = analyzePlayers(csv, 0, 1, [{ name: 'José Pérez', position: 'Delantero', active: false }]);
  assert.equal(nameKey('  José   Pérez '), 'josé pérez');
  assert.equal(rows[0].duplicates.length, 2);
  assert.match(rows[0].duplicates[0], /Inactivo/);
  assert.equal(rows[1].duplicates.length, 2);
});
test('callback solo permite destinos internos aprobados', () => {
  assert.equal(safeAuthDestination('/reset-password'), '/reset-password');
  for (const input of ['//evil.invalid', '/\\evil.invalid', 'https://evil.invalid', '/admin', null, '/reset-password?next=//evil.invalid']) assert.equal(safeAuthDestination(input), '/dashboard');
});
