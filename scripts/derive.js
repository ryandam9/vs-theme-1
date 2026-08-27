// Derives a complete ~65-entry palette from a short source palette (e.g. a bird palette).
//
// Principle: Monokai Dimmed's *lightness* architecture is what makes it readable, so we
// keep it and replace only the *hue* architecture. Every role snaps to the nearest source
// colour by hue, inherits that colour's hue + chroma, keeps its own lightness rank, and is
// then pushed until it clears a contrast floor against the derived background.
'use strict';
const { hexToOklch, oklchToHex, contrast, hueDist, enforceContrast, clamp } = require('./color.js');

// --- role classification -------------------------------------------------------------
// bgish  : surfaces you put text ON        fgish : neutral text/chrome ON those surfaces
const BGISH = ['bg', 'bgDeep', 'bgTabs', 'line', 'bgActivity', 'bgTabInactive', 'hover',
  'selInactive', 'chrome', 'dropdown', 'button', 'gutter', 'listSel', 'whitespace',
  'indentActive', 'sel', 'selHi', 'wordHi', 'wordHiStrong'];
const FGISH = ['muted', 'fgMuted', 'fgUI', 'fgTab', 'white', 'fg'];
const ACCENT = ['accent', 'cursor', 'highlight'];
const SYNTAX = ['comment', 'string', 'blue', 'purple', 'yellow', 'orange', 'red', 'selfRef',
  'decoratorRef', 'gray', 'keyword', 'keywordControl', 'teal', 'violet', 'func', 'jsVar',
  'gold', 'mauve', 'pink', 'type'];
const SEMANTIC = ['diffHeader', 'diffDel', 'diffChg', 'diffIns', 'info', 'warn', 'error',
  'debug', 'invalid'];                                   // meaning-carrying: hue preserved
const VERBATIM = ['transparent'];

// Contrast floors against the derived background. Deliberately dim roles get low floors.
const FLOOR = { fg: 8.0, comment: 3.2, gray: 2.4, whitespace: 1.15, indentActive: 1.5,
  white: 11.0, fgTab: 7.5, fgUI: 6.5, fgMuted: 5.0, muted: 3.2, __syntax: 4.5,
  __semantic: 3.6, __ansi: 3.4, __accent: 2.2 };

// Light-theme lightness bands (dark theme keeps upstream lightness verbatim).
const LIGHT_BAND = { bgish: [0.985, 0.780], fgish: [0.620, 0.230], syntax: [0.660, 0.300] };

const lerp = (a, b, t) => a + (b - a) * t;

// A palette like plains-wanderer is a single brown-to-amber arc: snapping 20 syntax roles
// onto it makes every role the same colour. Rather than distort the source colours, extend
// the arc outward with analogous derived hues at the palette's own spacing -- the real
// colours still win the roles nearest them, the derived ones only fill what was missing.
function expandPool(seed, minSpan, minCount) {
  const hues = seed.map(c => c.h).sort((a, b) => a - b);
  let start = hues[0], end = hues[hues.length - 1], span = end - start;
  if (hues.length > 1) {                       // the arc may wrap through 0 degrees
    let gap = 360 - span, at = -1;
    for (let i = 1; i < hues.length; i++) {
      if (hues[i] - hues[i - 1] > gap) { gap = hues[i] - hues[i - 1]; at = i; }
    }
    if (at >= 0) { start = hues[at]; end = hues[at - 1] + 360; }
    span = end - start;
  }
  const pool = seed.slice();
  const mk = (h, C, L) => pool.push({ hex: null, derived: true, L, C, h: ((h % 360) + 360) % 360 });
  const meanC = seed.reduce((s, c) => s + c.C, 0) / seed.length;
  const meanL = seed.reduce((s, c) => s + c.L, 0) / seed.length;

  // Extend the arc outward until it is wide enough to carry distinguishable roles. Only
  // the arc the palette actually occupies grows -- a sepia palette stays sepia.
  const step = clamp(seed.length > 1 ? span / (seed.length - 1) : 40, 16, 45);
  let lo = start, hi = end, flip = false;
  while ((hi - lo < minSpan || pool.length < minCount) && hi - lo < 300) {
    mk(flip ? (lo -= step) : (hi += step), meanC, meanL);
    flip = !flip;
  }

  // Fill holes *inside* the arc too. A palette can be wide overall and still be three
  // tight clusters (oriole: rust, olive, lavender), which strands every role in between.
  const MAX_GAP = 55;
  const arc = pool.map(c => (c.h < lo ? c.h + 360 : c.h)).sort((a, b) => a - b);
  for (let i = 1; i < arc.length; i++) {
    const gap = arc[i] - arc[i - 1];
    if (gap <= MAX_GAP) continue;
    const n = Math.ceil(gap / MAX_GAP) - 1;
    for (let k = 1; k <= n; k++) mk(arc[i - 1] + (gap * k) / (n + 1), meanC, meanL);
  }
  return pool;
}

// Rank each role's lightness within its band as t in [0,1].
function ranks(base, roles) {
  const Ls = roles.map(r => hexToOklch(base[r]).L);
  const lo = Math.min(...Ls), hi = Math.max(...Ls);
  const out = {};
  roles.forEach((r, i) => { out[r] = hi - lo < 1e-6 ? 0 : (Ls[i] - lo) / (hi - lo); });
  return out;
}

function derive(base, source, opts = {}) {
  const mode = opts.mode || 'dark';
  const light = mode === 'light';
  const tintStrength = opts.tintStrength ?? 1;
  const src = source.map(h => ({ hex: h, ...hexToOklch(h) }));

  // Hue pool: source colours saturated enough for their hue to be meaningful.
  const seed = src.filter(c => c.C >= 0.02);
  if (!seed.length) throw new Error('source palette has no chromatic colours');
  const pool = expandPool(seed, opts.minHueSpan ?? 150, opts.minHues ?? 8);

  // Tint anchor -- the colour the whole UI is tinted toward. The palette's darkest (or,
  // for a light theme, lightest) colour that still carries a hue: a kookaburra's navy is
  // the background you want, not whichever of its colours happens to be most saturated.
  const dir0 = light ? -1 : 1;
  const anchorable = src.filter(c => c.C >= 0.03).sort((a, b) => (a.L - b.L) * dir0);
  const anchor = opts.anchor
    ? { hex: opts.anchor, ...hexToOklch(opts.anchor) }
    : anchorable[0] || src.slice().sort((a, b) => b.C - a.C)[0];
  const tintHue = anchor.C >= 0.015 ? anchor.h : pool.slice().sort((a, b) => b.C - a.C)[0].h;
  const anchorC = Math.max(anchor.C, 0.02);

  const snap = h => pool.reduce((best, c) => (hueDist(h, c.h) < hueDist(h, best.h) ? c : best));

  const out = {};
  const rBg = ranks(base, BGISH), rFg = ranks(base, FGISH), rSy = ranks(base, SYNTAX);

  // --- surfaces ----------------------------------------------------------------------
  for (const role of BGISH) {
    const b = hexToOklch(base[role]);
    const t = rBg[role];
    const L = light ? lerp(...LIGHT_BAND.bgish, t) : b.L;
    // Overlay surfaces (selection / word-highlight) keep their own hue+chroma character.
    const overlay = ['wordHi', 'wordHiStrong', 'sel', 'selHi', 'whitespace', 'indentActive'].includes(role);
    const s = overlay && b.C > 0.01 ? snap(b.h) : { h: tintHue, C: anchorC };
    const C = overlay && b.C > 0.01
      ? clamp(b.C * 0.4 + s.C * 0.6, 0, 0.14) * tintStrength
      : clamp(anchorC * (light ? 0.30 : 0.50), 0.005, light ? 0.020 : 0.028) * tintStrength;
    out[role] = oklchToHex({ L, C, h: s.h });
  }
  const bg = out.bg;

  for (const role of FGISH) {
    const b = hexToOklch(base[role]);
    const L = light ? lerp(...LIGHT_BAND.fgish, rFg[role]) : b.L;
    const C = clamp(anchorC * 0.22, 0.003, 0.014) * tintStrength;
    out[role] = enforceContrast(oklchToHex({ L, C, h: tintHue }), bg, FLOOR[role] ?? 4.5);
  }

  // --- accents (cursor, focus border, list highlight) --------------------------------
  for (const role of ACCENT) {
    const b = hexToOklch(base[role]);
    const s = snap(b.h);
    const L = light ? clamp(1.02 - b.L, 0.28, 0.72) : b.L;
    out[role] = enforceContrast(
      oklchToHex({ L, C: clamp(b.C * 0.3 + s.C * 0.7, 0, 0.2) * tintStrength, h: s.h }),
      bg, FLOOR.__accent);
  }

  // --- syntax ------------------------------------------------------------------------
  const plan = SYNTAX.map(role => {
    const b = hexToOklch(base[role]);
    const s = snap(b.h);
    return { role, h: s.h, C: clamp(b.C * 0.25 + s.C * 0.75, 0, 0.22) * tintStrength,
             L: light ? lerp(...LIGHT_BAND.syntax, rSy[role]) : b.L };
  });

  // Push each role off the background first -- that step alone bunches roles together,
  // so the separation pass has to run on the post-contrast lightness, not before it.
  for (const p of plan) {
    p.L = hexToOklch(enforceContrast(oklchToHex(p), bg, FLOOR[p.role] ?? FLOOR.__syntax)).L;
  }
  // Roles left sharing a hue get pushed apart in lightness, always *away* from the
  // background so no role can lose the contrast it just gained.
  const MIN_DL = 0.058, dir = light ? -1 : 1;
  const LIMIT = light ? 0.20 : 0.94;
  const byHue = plan.slice().sort((a, b) => a.h - b.h);
  for (let i = 0; i < byHue.length;) {
    let j = i + 1;
    while (j < byHue.length && byHue[j].h - byHue[j - 1].h < 9) j++;
    const group = byHue.slice(i, j);
    i = j;
    if (group.length < 2) continue;
    group.sort((a, b) => (a.L - b.L) * dir);

    // Nudge each role just far enough off the one below it, keeping upstream's lightness
    // wherever the roles were already far enough apart.
    let cur = group[0].L;
    for (const p of group) {
      if ((p.L - cur) * dir < MIN_DL) p.L = cur + dir * MIN_DL; 
      cur = p.L;
    }

    // If that runs the top of the group past the usable range, there is no room to
    // separate this many roles by lightness alone: distribute over what room exists and
    // open chroma as a second axis, pale-to-vivid at a single hue.
    if ((cur - LIMIT) * dir > 0) {
      const gapL = ((LIMIT - group[0].L) * dir) / (group.length - 1);
      group.forEach((p, k) => { p.L = group[0].L + dir * gapL * k; });
      const baseC = group.reduce((s, p) => s + p.C, 0) / group.length;
      group.forEach((p, k) => {
        p.C = clamp(baseC * lerp(0.45, 1.75, k / (group.length - 1)), 0.012, 0.24);
      });
    }
  }
  for (const p of plan) {
    out[p.role] = enforceContrast(oklchToHex(p), bg, FLOOR[p.role] ?? FLOOR.__syntax);
  }

  // --- meaning-carrying colours: hue kept, only made readable on the new background ---
  for (const role of SEMANTIC) out[role] = enforceContrast(base[role], bg, FLOOR.__semantic);
  for (const role of VERBATIM) out[role] = base[role];

  // --- terminal ansi: nudged toward the palette, kept mutually distinguishable --------
  const NUDGE = opts.ansiNudge ?? 0.25;
  for (const role of Object.keys(base).filter(k => k.startsWith('ansi'))) {
    const b = hexToOklch(base[role]);
    const s = snap(b.h);
    let d = ((s.h - b.h + 540) % 360) - 180;
    const h = (b.h + d * NUDGE + 360) % 360;
    const L = light ? clamp(1.04 - b.L, 0.25, 0.70) : b.L;
    out[role] = enforceContrast(oklchToHex({ L, C: b.C, h }), bg, FLOOR.__ansi);
  }

  // Anything in the base we did not classify falls through unchanged, so the build can
  // never fail on a missing $ref.
  for (const k of Object.keys(base)) {
    if (k.startsWith('//')) continue;
    if (!(k in out)) out[k] = base[k];
  }
  return { palette: out, meta: { mode, tintHue, anchor: anchor.hex, poolSize: pool.length } };
}

module.exports = { derive, BGISH, FGISH, ACCENT, SYNTAX, SEMANTIC, FLOOR };
