// Builds wallpapers.js: the scene kit from core.js, the 12 scenes (each in its own block), then web-engine.js.
// Source scenes/core are vendored unmodified from 0toshigami/claude-desktop-themes (MIT) in vendor/.
// Run: node tools/build.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vendor = join(root, 'vendor', 'claude-desktop-themes');
const read = p => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const indent = (text, by) => text.trimEnd().replace(/^(?=.)/gm, ' '.repeat(by));

const core = read(join(vendor, 'core.js'));
// Color helpers (rgb/hex/mix/hsl/luma): from `const ok` up to the WCAG comment. Scene kit: from its marker to the end.
const helpersStart = core.indexOf('const ok =');
const helpersEnd = core.indexOf('// WCAG contrast');
const kitStart = core.indexOf('// The scene kit');
if (helpersStart < 0 || helpersEnd < 0 || kitStart < 0) throw new Error('core.js layout changed; update tools/build.mjs');
const kit = "const root = document.documentElement; // (neon-rain reads root.dataset.themeEvent; unset on the web)\n" + core.slice(helpersStart, helpersEnd) + '\nlet SIDE = 0;\n' + core.slice(kitStart);

const scenes = readdirSync(join(vendor, 'scenes')).filter(f => f.endsWith('.js')).sort()
  .map(f => `// scenes/${f}\n` + read(join(vendor, 'scenes', f)));
const engine = read(join(root, 'web-engine.js'));

const out = ['// Built by tools/build.mjs: edit web-engine.js or the vendored sources, then rebuild.',
  '// Scenes and scene kit: 0toshigami/claude-desktop-themes (MIT), see vendor/claude-desktop-themes/LICENSE.',
  '(() => {', indent(kit, 2), '',
  ...scenes.flatMap(s => ['  {', indent(s, 4), '  }', '']),
  indent(engine, 2), '})();', ''].join('\n');
writeFileSync(join(root, 'wallpapers.js'), out);
console.log(`wallpapers.js: ${scenes.length} scenes, ${out.length} bytes`);
