#!/usr/bin/env node
// Ground truth: ask gopls what tokens it emits for a Go file, and report which theme
// rule colors each one. Beats guessing at language-server behaviour.
//   npm run tokens -- samples/sample.go
const { execFileSync } = require('child_process');
const fs = require('fs');

const file = process.argv[2];
if (!file || !file.endsWith('.go')) {
  console.error('usage: npm run tokens -- <file.go>   (gopls only; use Inspect Editor Tokens for other languages)');
  process.exit(2);
}
let raw;
try { raw = execFileSync('gopls', ['semtok', file], { encoding: 'utf8' }); }
catch { console.error('gopls not found or failed on ' + file); process.exit(1); }

const theme = JSON.parse(fs.readFileSync('themes/my-monokai-dimmed-color-theme.json', 'utf8'));
const sem = theme.semanticTokenColors || {};
const types = new Map(), mods = new Map();
for (const [, t, m] of raw.matchAll(/\/\*[⇒⇐]\d+,(\w+),\[([^\]]*)\]\*\//g)) {
  types.set(t, (types.get(t) || 0) + 1);
  for (const x of m.split(/\s+/).filter(Boolean)) mods.set(x, (mods.get(x) || 0) + 1);
}

const lum = h => { const c = [1,3,5].map(i => parseInt(h.slice(i,i+2),16)/255)
  .map(x => x <= .04045 ? x/12.92 : ((x+.055)/1.055)**2.4);
  return .2126*c[0] + .7152*c[1] + .0722*c[2]; };
const ratio = h => { const a = lum(h), b = lum(theme.colors['editor.background']);
  return ((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2); };
const colorOf = v => typeof v === 'string' ? v : v && v.foreground;

console.log(`\n${file} -- ${[...types.values()].reduce((a,b)=>a+b,0)} tokens\n`);
console.log('TYPE           COUNT  RULE                       COLOR    CONTRAST');
for (const [t, n] of [...types].sort((a,b) => b[1]-a[1])) {
  const key = [`${t}:go`, t].find(k => sem[k]);
  const c = key && colorOf(sem[key]);
  const warn = c && +ratio(c) < 4.5 ? '  <-- below 4.5:1' : '';
  console.log(`${t.padEnd(14)} ${String(n).padStart(4)}   ${(key||'(TextMate fallback)').padEnd(26)} ${(c||'-').padEnd(8)} ${c ? ratio(c)+':1' : ''}${warn}`);
}
console.log('\nMODIFIERS: ' + [...mods].sort((a,b)=>b[1]-a[1]).map(([m,n])=>`${m}(${n})`).join(', '));
const dead = Object.keys(sem).filter(k => k.endsWith(':go') && !types.has(k.split(':')[0].split('.')[0]));
if (dead.length) console.log('DEAD :go RULES: ' + dead.join(', '));
