const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const compiled = ts.transpileModule(fs.readFileSync('src/lib/theme.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exported = {};
vm.runInNewContext(compiled, { exports: exported });

test('el tema queda aplicado antes de montar React en cada documento nuevo', () => {
  for (const [saved, systemDark, expected] of [['dark', false, 'dark'], ['light', true, 'light'], [null, true, 'dark'], [null, false, 'light'], ['invalid', true, 'dark']]) {
    for (let navigation = 0; navigation < 2; navigation++) {
      const root = { dataset: {}, style: {} };
      vm.runInNewContext(exported.themeInitializationScript, {
        document: { documentElement: root }, localStorage: { getItem: () => saved },
        window: { matchMedia: () => ({ matches: systemDark }) },
      });
      assert.equal(root.dataset.theme, expected);
      assert.equal(root.style.colorScheme, expected);
    }
  }
});

test('almacenamiento bloqueado usa el tema del sistema sin interrumpir la carga', () => {
  const root = { dataset: {}, style: {} };
  vm.runInNewContext(exported.themeInitializationScript, {
    document: { documentElement: root }, localStorage: { getItem: () => { throw new Error('SecurityError'); } },
    window: { matchMedia: () => ({ matches: true }) },
  });
  assert.equal(root.dataset.theme, 'dark');
});

test('la inicialización está en head antes del contenido visible', () => {
  const layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
  assert.match(layout, /<head><script dangerouslySetInnerHTML=\{\{ __html: themeInitializationScript \}\} \/><\/head><body>/);
});
