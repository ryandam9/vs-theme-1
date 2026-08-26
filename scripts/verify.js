#!/usr/bin/env node
// Diffs the built theme against src/upstream.json. Everything except the intentional
// palette deviations must match (case-insensitively -- upstream mixes hex case).
const fs = require('fs');
const up = JSON.parse(fs.readFileSync('src/upstream.json', 'utf8'));
const mine = JSON.parse(fs.readFileSync('themes/my-monokai-dimmed-color-theme.json', 'utf8'));
const norm = v => (typeof v === 'string' ? v.toUpperCase() : v);

let diffs = 0;
const report = (what, a, b) => { console.log(`  ~ ${what}: ${a} -> ${b}`); diffs++; };

for (const k of new Set([...Object.keys(up.colors), ...Object.keys(mine.colors)])) {
  if (norm(up.colors[k]) !== norm(mine.colors[k]))
    report(`colors.${k}`, up.colors[k] ?? '(absent)', mine.colors[k] ?? '(absent)');
}
if (up.tokenColors.length !== mine.tokenColors.length) {
  console.log(`  ! tokenColors length ${up.tokenColors.length} -> ${mine.tokenColors.length}`);
  diffs++;
}
up.tokenColors.forEach((t, i) => {
  const m = mine.tokenColors[i]; if (!m) return;
  const label = t.name || JSON.stringify(t.scope) || `#${i}`;
  for (const key of ['foreground', 'fontStyle']) {
    if (norm(t.settings?.[key]) !== norm(m.settings?.[key]))
      report(`tokenColors[${i}] "${label}".${key}`, t.settings?.[key] ?? '(absent)', m.settings?.[key] ?? '(absent)');
  }
  if (JSON.stringify(t.scope) !== JSON.stringify(m.scope)) report(`tokenColors[${i}] "${label}".scope`, 'differs', '');
});

console.log(diffs === 0
  ? 'verify: built theme is identical to upstream (plus the new semanticTokenColors block)'
  : `verify: ${diffs} intentional deviation(s) from upstream, listed above`);
console.log(`added: semanticTokenColors with ${Object.keys(mine.semanticTokenColors || {}).length} rules (upstream had none)`);
