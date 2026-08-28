#!/usr/bin/env node
// Resolves src/theme.jsonc against a palette.
//
//   node build.js                 -> base theme  -> themes/my-monokai-dimmed-color-theme.json
//   node build.js bee_eater       -> variant     -> palettes/bee_eater/  (standalone extension)
//   node build.js --all           -> base + every palette under palettes/
'use strict';
const fs = require('fs');
const path = require('path');
const { derive } = require('./scripts/derive.js');

const BASE_OUT = 'themes/my-monokai-dimmed-color-theme.json';
const ROOT_PKG = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// --- minimal JSONC comment stripper (string- and escape-aware) ---
function stripComments(src) {
  let out = '', i = 0, inStr = false, inLine = false, inBlock = false;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (inLine) { if (c === '\n') { inLine = false; out += c; } i++; continue; }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i += 2; } else i++; continue; }
    if (inStr) {
      out += c;
      if (c === '\\') { out += n ?? ''; i += 2; continue; }
      if (c === '"') inStr = false;
      i++; continue;
    }
    if (c === '"') { inStr = true; out += c; i++; continue; }
    if (c === '/' && n === '/') { inLine = true; i += 2; continue; }
    if (c === '/' && n === '*') { inBlock = true; i += 2; continue; }
    out += c; i++;
  }
  return out;
}

const readJsonc = f => JSON.parse(stripComments(fs.readFileSync(f, 'utf8')));
const themeSrc = readJsonc('src/theme.jsonc');
const basePalette = JSON.parse(fs.readFileSync('src/palette.json', 'utf8'));

// Resolve "$name" / "$name+AA" against a palette, walking the whole theme tree.
function resolveTheme(theme, palette) {
  const errors = [], used = new Set();
  const resolve = (value, where) => {
    if (typeof value !== 'string' || !value.startsWith('$')) return value;
    const [name, alpha] = value.slice(1).split('+');
    const hex = palette[name];
    if (typeof hex !== 'string' || !hex.startsWith('#')) {
      errors.push(`unknown palette ref "${value}" at ${where}`);
      return value;
    }
    used.add(name);
    if (!alpha) return hex;
    if (!/^[0-9a-fA-F]{2}$/.test(alpha)) {
      errors.push(`bad alpha "${alpha}" in "${value}" at ${where}`);
      return hex;
    }
    return hex + alpha;
  };
  const walk = (node, where) => {
    if (Array.isArray(node)) return node.map((v, i) => walk(v, `${where}[${i}]`));
    if (node && typeof node === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(node)) {
        if (k.startsWith('//')) continue;                 // drop authoring notes
        out[k] = walk(v, `${where}.${k}`);
      }
      return out;
    }
    return resolve(node, where);
  };
  const built = walk(theme, 'theme');
  return { built, errors, used };
}

function fail(errors) {
  console.error('BUILD FAILED:');
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}

function report(label, built, palette, used) {
  const declared = Object.keys(palette).filter(k => !k.startsWith('//'));
  const unused = declared.filter(k => !used.has(k));
  console.log(`built ${label}`);
  console.log(`  workbench colors      : ${Object.keys(built.colors).length}`);
  console.log(`  semanticTokenColors   : ${Object.keys(built.semanticTokenColors).length}`);
  console.log(`  tokenColors           : ${built.tokenColors.length}`);
  console.log(`  palette used          : ${used.size}/${declared.length}`);
  if (unused.length) console.log(`  unused palette entries: ${unused.join(', ')}`);
}

function buildBase() {
  const { built, errors, used } = resolveTheme(themeSrc, basePalette);
  if (errors.length) fail(errors);
  fs.mkdirSync(path.dirname(BASE_OUT), { recursive: true });
  fs.writeFileSync(BASE_OUT, JSON.stringify(built, null, 2) + '\n');
  report(BASE_OUT, built, basePalette, used);
}

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function buildVariant(name) {
  const dir = path.join('palettes', name);
  const srcFile = path.join(dir, 'source.json');
  if (!fs.existsSync(srcFile)) fail([`no such palette: ${srcFile}`]);
  const source = JSON.parse(fs.readFileSync(srcFile, 'utf8'));

  const { palette, meta } = derive(basePalette, source.colors, {
    mode: source.mode,
    tintStrength: source.tintStrength,
    ansiNudge: source.ansiNudge,
    anchor: source.anchor,
  });
  Object.assign(palette, source.overrides || {});          // hand overrides win

  const label = source.displayName;
  const id = slug(label);
  const version = source.version || ROOT_PKG.version;
  const { built, errors, used } = resolveTheme(themeSrc, palette);
  if (errors.length) fail(errors);
  built.name = label;
  built.type = meta.mode;

  // Optional per-theme TextMate rules are appended after the shared template so
  // variants can refine language-specific scopes without changing every theme.
  if (Array.isArray(source.tokenColorOverrides) && source.tokenColorOverrides.length) {
    const resolved = resolveTheme(source.tokenColorOverrides, palette);
    if (resolved.errors.length) fail(resolved.errors);
    built.tokenColors.push(...resolved.built);
    for (const key of resolved.used) used.add(key);
  }

  // The generated palette is written out too, so a variant stays as inspectable and
  // hand-editable as the base theme.
  const themesDir = path.join(dir, 'themes');
  fs.rmSync(themesDir, { recursive: true, force: true });
  fs.mkdirSync(themesDir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'palette.json'),
    JSON.stringify({
      '//': `GENERATED by build.js from source.json -- do not hand-edit.`,
      '//edit': 'To change a colour, add it to "overrides" in source.json and rebuild.',
      '//derivedFrom': source.colors.join(' '),
      '//mode': meta.mode,
      '//tintAnchor': meta.anchor,
      ...palette,
    }, null, 2) + '\n');
  const themeFile = path.join(themesDir, `${id}-color-theme.json`);
  fs.writeFileSync(themeFile, JSON.stringify(built, null, 2) + '\n');

  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
    name: id,
    displayName: label,
    description: `${ROOT_PKG.description} Recoloured from the ${source.displayName} palette.`,
    version,
    publisher: ROOT_PKG.publisher,
    license: ROOT_PKG.license,
    private: true,
    engines: ROOT_PKG.engines,
    categories: ['Themes'],
    keywords: ['monokai', meta.mode, 'semantic highlighting', 'theme', source.displayName],
    galleryBanner: { color: palette.bg, theme: meta.mode },
    contributes: {
      themes: [{ id: label, label, uiTheme: meta.mode === 'light' ? 'vs' : 'vs-dark',
                 path: `./themes/${id}-color-theme.json` }],
    },
    scripts: {
      build: `cd ../.. && node build.js ${name}`,
      package: `npm run build && npx --yes @vscode/vsce package --no-dependencies --allow-missing-repository`,
      'install-local': `npm run package && code --install-extension ${id}-${version}.vsix --force`,
    },
  }, null, 2) + '\n');

  fs.writeFileSync(path.join(dir, '.vscodeignore'),
    ['source.json', 'palette.json', '*.vsix', '.gitignore', ''].join('\n'));
  fs.copyFileSync('LICENSE', path.join(dir, 'LICENSE'));

  const swatch = source.colors.map(c => `\`${c}\``).join(' ');
  fs.writeFileSync(path.join(dir, 'README.md'), [
    `# ${label}`, '',
    `A ${meta.mode} recolour of My Monokai Dimmed, derived from the`,
    `**${source.displayName}** palette:`, '', swatch, '',
    `Every one of the ~70 theme colours is snapped to the nearest palette colour by hue,`,
    `keeps Monokai Dimmed's lightness structure, and is checked against a contrast floor`,
    `on the derived background (\`${palette.bg}\`).`, '',
    '## Build and install', '',
    '```sh', 'npm run install-local    # build + package + install into VS Code',
    'npm run package          # build + package only',
    'npm run build            # regenerate the theme JSON only', '```', '',
    'Then pick **' + label + '** in `Preferences: Color Theme`.', '',
    'Edit `source.json` (palette, `mode`, `overrides`, or `tokenColorOverrides`) and rebuild.', '',
    `Palette from the [feathers](https://github.com/shandiya/feathers) R package.`, '',
  ].join('\n'));

  report(themeFile, built, palette, used);
  console.log(`  mode / anchor         : ${meta.mode} / ${meta.anchor} (${meta.poolSize} hues)`);
  return { name, id, label, dir, mode: meta.mode, bg: palette.bg, version };
}

const arg = process.argv[2];
if (!arg) buildBase();
else if (arg === '--all') {
  buildBase();
  for (const n of fs.readdirSync('palettes').sort()) {
    if (fs.existsSync(path.join('palettes', n, 'source.json'))) { console.log(); buildVariant(n); }
  }
} else buildVariant(arg);
