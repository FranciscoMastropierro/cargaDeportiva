const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
module.exports = function load(file) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'require', 'module', source)(mod.exports, id => id.startsWith('.') ? load(path.resolve(path.dirname(file), id) + '.ts') : require(id), mod);
  return mod.exports;
};
