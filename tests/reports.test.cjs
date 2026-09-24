const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'require', 'module', source)(mod.exports, require, mod);
  return mod.exports;
}
const { parseDashboardFilters: parse, dashboardDateRange: range, dashboardTitle: title, dashboardQuery: query } = load('src/lib/validations/dashboard.ts');
const { reportText, borgText } = load('src/lib/reports/format.ts');
test('filtros inválidos se rechazan y el período inicial es total', () => {
  const initial = parse({}, new Date('2026-09-21T12:00:00Z'));
  assert.equal(initial.period, 'total');
  assert.equal(initial.date, '2026-09');
  for (const date of ['0000-01', '2026-00', '2026-13', '10000-01', '26-01', '2026-02-31', 'bad']) assert.equal(parse({ date }), null, date);
  assert.equal(parse({ period: 'bad' }), null);
  assert.equal(parse({ date: ['2026-01'] }), null);
  assert.equal(parse({ player: 'bad' }), null);
});
test('límites del calendario, años extremos y cambio de período', () => {
  for (const [date, end] of [['0001-02','0001-02-28'], ['0099-12','0099-12-31'], ['2000-02','2000-02-29'], ['1900-02','1900-02-28'], ['9999-12','9999-12-31']]) assert.equal(range(parse({ period: 'month', date })).end, end);
  assert.deepEqual(range(parse({ period: 'year', date: '9999' })), { start: '9999-01-01', end: '9999-12-31' });
  assert.equal(range(parse({ period: 'total' })), null);
  assert.equal(title(parse({ period: 'month', date: '2026-09' })), 'Carga septiembre de 2026');
  assert.equal(title(parse({ period: 'year', date: '2026-09' })), 'Carga de 2026');
  assert.equal(title(parse({ period: 'total' })), 'Carga histórica');
  assert.equal(query(parse({ date: '2026-09', page: '2' })).has('page'), false);
});
const meta = { club: 'Club & Unión', period: 'Carga septiembre de 2026', competition: 'Copa', player: 'Todos', generatedAt: '21/09/2026' };
test('texto completo conserva 12 jugadores, orden, acentos y métricas cero/nulas', () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({ name: `José ${i}`, position: 'Arquero', minutes: 0, matches: i === 0 ? 0 : 1, averageBorg: i === 0 ? null : 0, recentMatches: i }));
  const text = reportText(meta, rows);
  assert.equal(text.split('\n').filter(line => line.startsWith('José ')).length, 12);
  assert.ok(text.indexOf('José 0 ') < text.indexOf('José 11 '));
  assert.ok(text.includes('Club & Unión'));
  assert.ok(text.includes('0 minutos; 0 partidos; Borg promedio: Sin registros'));
  assert.ok(text.includes('0 minutos; 1 partidos; Borg promedio: 0.0'));
  assert.ok(text.includes('frecuencia reciente: 11 partidos'));
  assert.equal(borgText(2.56), '2.6');
  assert.ok(!text.includes('No hay jugadores'));
  assert.ok(reportText(meta, []).includes('No hay jugadores para los filtros seleccionados'));
});
