#!/usr/bin/env node
// Renders every built palette side by side as a single HTML page, so a theme can be judged
// before it is installed. The code block is a hand-mapped mock, not a real tokenizer run --
// it shows the palette roles in context, which is what you actually pick a theme on.
'use strict';
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2] || 'preview.html';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// [role, text] -- "\n" starts a new line.
const SAMPLE = [
  ['comment', '# derive a full theme from a short palette'], ['\n'],
  ['keywordControl', 'from'], ['fg', ' '], ['type', 'colorsys'], ['fg', ' '],
  ['keywordControl', 'import'], ['fg', ' '], ['func', 'rgb_to_hls'], ['\n'], ['\n'],
  ['decoratorRef', '@dataclass'], ['\n'],
  ['keyword', 'class'], ['fg', ' '], ['type', 'Plumage'], ['fg', '('], ['type', 'Palette'], ['fg', '):'], ['\n'],
  ['fg', '    '], ['string', "'''Snap each role to its nearest hue.'''"], ['\n'],
  ['fg', '    '], ['jsVar', 'name'], ['fg', ': '], ['type', 'str'], ['\n'],
  ['fg', '    '], ['jsVar', 'hues'], ['fg', ': '], ['type', 'list'], ['fg', '['], ['type', 'float'], ['fg', '] = '], ['func', 'field'], ['fg', '('], ['jsVar', 'default_factory'], ['fg', '='], ['type', 'list'], ['fg', ')'], ['\n'], ['\n'],
  ['fg', '    '], ['keyword', 'def'], ['fg', ' '], ['func', 'snap'], ['fg', '('], ['selfRef', 'self'], ['fg', ', '], ['jsVar', 'h'], ['fg', ': '], ['type', 'float'], ['fg', ') -> '], ['type', 'float'], ['fg', ':'], ['\n'],
  ['fg', '        '], ['keywordControl', 'if'], ['fg', ' '], ['keyword', 'not'], ['fg', ' '], ['selfRef', 'self'], ['fg', '.'], ['jsVar', 'hues'], ['fg', ':'], ['\n'],
  ['fg', '            '], ['keywordControl', 'raise'], ['fg', ' '], ['type', 'ValueError'], ['fg', '('], ['string', '"no chromatic colours"'], ['fg', ')'], ['\n'],
  ['fg', '        '], ['jsVar', 'span'], ['fg', ' = '], ['func', 'max'], ['fg', '('], ['yellow', '150.0'], ['fg', ', '], ['selfRef', 'self'], ['fg', '.'], ['func', 'arc'], ['fg', '())'], ['\n'],
  ['fg', '        '], ['keywordControl', 'return'], ['fg', ' '], ['func', 'min'], ['fg', '('], ['selfRef', 'self'], ['fg', '.'], ['jsVar', 'hues'], ['fg', ', '], ['jsVar', 'key'], ['fg', '='], ['keyword', 'lambda'], ['fg', ' '], ['jsVar', 'c'], ['fg', ': '], ['func', 'abs'], ['fg', '('], ['jsVar', 'c'], ['fg', ' - '], ['jsVar', 'h'], ['fg', ')) '], ['comment', '# nearest'], ['\n'],
];

function codeBlock(p) {
  let out = '';
  for (const [role, text] of SAMPLE) {
    if (role === '\n') { out += '\n'; continue; }
    out += `<span style="color:${p[role]}">${esc(text)}</span>`;
  }
  return out;
}

const dirs = fs.readdirSync('palettes').sort()
  .filter(n => fs.existsSync(path.join('palettes', n, 'palette.json')));

const cards = dirs.map(name => {
  const p = JSON.parse(fs.readFileSync(path.join('palettes', name, 'palette.json'), 'utf8'));
  const src = JSON.parse(fs.readFileSync(path.join('palettes', name, 'source.json'), 'utf8'));
  const swatches = src.colors.map(c => `<i style="background:${c}"></i>`).join('');
  const roles = ['comment', 'string', 'keyword', 'func', 'type', 'yellow', 'orange', 'red', 'purple', 'selfRef', 'decoratorRef', 'teal']
    .map(r => `<i title="${r} ${p[r]}" style="background:${p[r]}"></i>`).join('');
  return `<section>
  <header><h2>${src.displayName}</h2><code>node build.js ${name}</code>
    <span class="mode ${p['//mode']}">${p['//mode']}</span></header>
  <div class="swatch">source <span>${swatches}</span> derived <span>${roles}</span></div>
  <div class="win" style="background:${p.bgTabs};border-color:${p.line}">
    <div class="tabs" style="background:${p.bgTabs};color:${p.muted}">
      <b style="background:${p.bg};color:${p.fgTab}">plumage.py</b>
      <em style="color:${p.muted}">palette.json</em>
    </div>
    <pre style="background:${p.bg};color:${p.fg}">${codeBlock(p)}</pre>
    <div class="status" style="background:${p.accent};color:${p.white}">master &nbsp;&nbsp;✓ 0 &nbsp;⚠ 0 &nbsp;&nbsp;Python</div>
  </div>
</section>`;
}).join('\n');

fs.writeFileSync(OUT, `<!doctype html><meta charset="utf-8"><title>My Monokai — palette variants</title>
<style>
  :root{color-scheme:light dark}
  body{font:14px/1.5 ui-sans-serif,system-ui,sans-serif;margin:0;padding:2rem;background:#141414;color:#ddd}
  h1{font-size:1.4rem;margin:0 0 .3rem}
  .lede{color:#999;margin:0 0 2rem;max-width:60ch}
  .grid{display:grid;gap:1.75rem;grid-template-columns:repeat(auto-fit,minmax(430px,1fr))}
  section{min-width:0}
  header{display:flex;align-items:baseline;gap:.6rem;flex-wrap:wrap;margin-bottom:.4rem}
  h2{font-size:1rem;margin:0}
  header code{font-size:11px;color:#7a7a7a}
  .mode{font-size:10px;text-transform:uppercase;letter-spacing:.08em;padding:1px 6px;border-radius:99px;border:1px solid #555;color:#999}
  .mode.light{background:#eee;color:#222;border-color:#eee}
  .swatch{display:flex;align-items:center;gap:.4rem;font-size:10px;color:#777;margin-bottom:.5rem;flex-wrap:wrap}
  .swatch span{display:inline-flex}
  .swatch i{width:15px;height:15px;display:block;border-radius:2px;margin-right:2px}
  .win{border:1px solid;border-radius:7px;overflow:hidden}
  .tabs{display:flex;font-size:11px}
  .tabs b,.tabs em{padding:5px 12px;font-style:normal;font-weight:400}
  pre{margin:0;padding:14px 16px;font:12px/1.65 ui-monospace,"SF Mono",Menlo,monospace;overflow-x:auto}
  .status{font-size:10px;padding:3px 10px}
</style>
<h1>My Monokai — palette variants</h1>
<p class="lede">Every colour below is derived from the short source palette on the left of each card.
Install one with <code>cd palettes/&lt;name&gt; &amp;&amp; npm run install-local</code>.</p>
<div class="grid">
${cards}
</div>
`);
console.log(`wrote ${OUT} (${dirs.length} palettes)`);
