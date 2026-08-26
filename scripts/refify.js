// One-time scaffolding tool: rewrites src/upstream.json into src/theme.jsonc with $palette
// refs, and injects the semanticTokenColors block. Kept in the repo for re-running against
// a future upstream version. Not part of `npm run build`.
const fs = require('fs');
const palette = JSON.parse(fs.readFileSync('src/palette.json', 'utf8'));
const upstream = JSON.parse(fs.readFileSync('src/upstream.json', 'utf8'));

const rev = new Map();
for (const [k, v] of Object.entries(palette)) {
  if (k.startsWith('//') || typeof v !== 'string' || !v.startsWith('#')) continue;
  if (!rev.has(v.toUpperCase())) rev.set(v.toUpperCase(), k);
}
rev.set('#9B0000', 'type'); // deliberate deviation: unreadable stock type color

const unresolved = new Set();
function refify(hex) {
  const H = hex.toUpperCase();
  if (rev.has(H)) return '$' + rev.get(H);
  if (H.length === 9) {
    const base = H.slice(0, 7), alpha = H.slice(7);
    if (rev.has(base)) return '$' + rev.get(base) + '+' + alpha;
  }
  unresolved.add(hex);
  return hex;
}

const colors = {};
for (const [k, v] of Object.entries(upstream.colors)) colors[k] = refify(v);

const tokenColors = upstream.tokenColors.map(t => {
  const out = {};
  if (t.name) out.name = t.name;
  if (t.scope) out.scope = t.scope;
  const s = { ...t.settings };
  if (s.foreground) s.foreground = refify(s.foreground);
  out.settings = s;
  return out;
});

// ---- Phase 4: explicit semantic token colors ----------------------------------------
// Selector syntax: <type>.<modifier>:<language>. These win over tokenColors, so coloring
// no longer depends on which language server happens to be attached.
const semanticTokenColors = {
  'namespace': '$purple',
  'type': '$type',
  'class': '$type',
  'enum': '$type',
  'interface': '$type',
  'struct': '$type',
  'typeParameter': '$teal',
  'parameter': '$blue',
  'variable': '$fg',
  'variable.readonly': '$violet',
  'variable.defaultLibrary': '$red',
  'property': '$purple',
  'property.readonly': '$violet',
  'enumMember': '$violet',
  'event': '$purple',
  'function': '$func',
  'function.defaultLibrary': '$purple',
  'method': '$func',
  'method.defaultLibrary': '$purple',
  'macro': '$orange',
  'label': '$gold',
  'comment': '$comment',
  'string': '$string',
  'keyword': '$purple',
  'modifier': '$purple',
  'number': '$blue',
  'regexp': '$orange',
  'operator': '$gray',
  'decorator': '$gold',
  'selfParameter': '$red',
  'builtinConstant': '$teal',
  '*.declaration': { fontStyle: 'bold' },
  '*.deprecated': { strikethrough: true },
  '*.static': { fontStyle: 'italic' },
  // --- gopls (Go) ---
  'type.defaultLibrary:go': '$teal',
  'variable.readonly:go': '$violet',
  'namespace:go': '$string',
  'operator:go': '$gray',
  // --- Pylance / Pyright (Python) ---
  'selfParameter:python': '$red',
  'clsParameter:python': '$red',
  'magicFunction:python': '$purple',
  'builtinConstant:python': '$teal',
  'module:python': '$purple',
  // --- TypeScript / JavaScript ---
  'variable.defaultLibrary:typescript': '$jsVar',
  'variable.defaultLibrary:javascript': '$jsVar',
  // --- rust-analyzer ---
  'lifetime:rust': '$orange',
  'builtinType:rust': '$teal',
};

const out = {
  '$schema': 'vscode://schemas/color-theme',
  name: 'My Monokai Dimmed',
  type: 'dark',
  semanticHighlighting: true,
  colors,
  semanticTokenColors,
  tokenColors,
};

const header = `// src/theme.jsonc -- AUTHORING SOURCE. Edit this + src/palette.json, then \`npm run build\`.
// Colors are written as "$name" / "$name+AA" and resolved from src/palette.json.
// Generated from src/upstream.json by scripts/refify.js; hand-edited thereafter.
`;
fs.writeFileSync('src/theme.jsonc', header + JSON.stringify(out, null, 2) + '\n');
console.log('wrote src/theme.jsonc');
console.log('semanticTokenColors rules:', Object.keys(semanticTokenColors).length);
if (unresolved.size) console.log('UNRESOLVED (left literal):', [...unresolved].join(', '));
else console.log('all colors resolved to palette refs');
