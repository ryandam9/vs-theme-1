#!/usr/bin/env node
// Resolves src/theme.jsonc + src/palette.json -> themes/my-monokai-dimmed-color-theme.json
const fs = require('fs');
const path = require('path');

const OUT = 'themes/my-monokai-dimmed-color-theme.json';

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

const palette = JSON.parse(fs.readFileSync('src/palette.json', 'utf8'));
const theme = JSON.parse(stripComments(fs.readFileSync('src/theme.jsonc', 'utf8')));

const errors = [];
const used = new Set();

// "$name" -> palette.name ; "$name+80" -> palette.name + "80"
function resolve(value, where) {
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
}

function walk(node, where) {
  if (Array.isArray(node)) return node.map((v, i) => walk(v, `${where}[${i}]`));
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('//')) continue;           // drop authoring notes
      out[k] = walk(v, `${where}.${k}`);
    }
    return out;
  }
  return resolve(node, where);
}

const built = walk(theme, 'theme');

if (errors.length) {
  console.error('BUILD FAILED:');
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}

const declared = Object.keys(palette).filter(k => !k.startsWith('//'));
const unused = declared.filter(k => !used.has(k));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(built, null, 2) + '\n');

console.log(`built ${OUT}`);
console.log(`  workbench colors      : ${Object.keys(built.colors).length}`);
console.log(`  semanticTokenColors   : ${Object.keys(built.semanticTokenColors).length}`);
console.log(`  tokenColors           : ${built.tokenColors.length}`);
console.log(`  palette used          : ${used.size}/${declared.length}`);
if (unused.length) console.log(`  unused palette entries: ${unused.join(', ')}`);
