#!/usr/bin/env node
// Contrast + distinctness audit for every built palette. Fails loudly so a bad palette
// can't ship silently.
'use strict';
const fs = require('fs');
const path = require('path');
const { contrast, hexToOklch, hueDist } = require('./color.js');
const { SYNTAX, FGISH, FLOOR } = require('./derive.js');

const strip = s => s.replace(/^\/\/.*$/gm, '');
const CHECK = [...SYNTAX, ...FGISH];
const only = process.argv[2];
let bad = 0;

const dirs = fs.readdirSync('palettes').sort()
  .filter(n => fs.existsSync(path.join('palettes', n, 'palette.json')))
  .filter(n => !only || n === only);

const rows = [];
for (const name of dirs) {
  const p = JSON.parse(fs.readFileSync(path.join('palettes', name, 'palette.json'), 'utf8'));
  const mode = p['//mode'];
  const bg = p.bg;
  const fails = [];
  for (const role of CHECK) {
    const floor = FLOOR[role] ?? FLOOR.__syntax;
    const c = contrast(p[role], bg);
    if (c < floor - 0.05) fails.push(`${role} ${p[role]} ${c.toFixed(2)}<${floor}`);
  }
  // Two syntax roles that are visually the same colour make code harder to read.
  const dupes = [];
  for (let i = 0; i < SYNTAX.length; i++)
    for (let j = i + 1; j < SYNTAX.length; j++) {
      const a = hexToOklch(p[SYNTAX[i]]), b = hexToOklch(p[SYNTAX[j]]);
      if (Math.abs(a.L - b.L) < 0.035 && hueDist(a.h, b.h) < 9 && Math.abs(a.C - b.C) < 0.03)
        dupes.push(`${SYNTAX[i]}~${SYNTAX[j]}`);
    }
  const worst = CHECK.reduce((m, r) => Math.min(m, contrast(p[r], bg)), Infinity);
  rows.push({ name, mode, bg, fg: p.fg, worst, fails, dupes });
  if (fails.length) bad++;
}

const pad = (s, n) => String(s).padEnd(n);
console.log(pad('palette', 26) + pad('mode', 7) + pad('bg', 10) + pad('fg', 10) + pad('min¬†contrast', 13) + 'issues');
console.log('-'.repeat(96));
for (const r of rows) {
  const issues = [...r.fails, ...r.dupes.map(d => `dup ${d}`)];
  console.log(pad(r.name, 26) + pad(r.mode, 7) + pad(r.bg, 10) + pad(r.fg, 10) +
    pad(r.worst.toFixed(2), 13) + (issues.length ? issues.join(', ') : 'ok'));
}
console.log('-'.repeat(96));
console.log(bad ? `${bad} palette(s) below contrast floor` : `all ${rows.length} palettes clear their contrast floors`);
process.exit(bad ? 1 : 0);
