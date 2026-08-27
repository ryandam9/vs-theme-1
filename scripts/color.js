// OKLab / OKLCH color math + WCAG contrast. No dependencies.
'use strict';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
  const c = v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}
const srgbToLinear = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const linearToSrgb = c => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

function hexToOklab(hex) {
  const [R, G, B] = hexToRgb(hex).map(v => srgbToLinear(v / 255));
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}
function oklabToRgbRaw([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}
const inGamut = lab => oklabToRgbRaw(lab).every(v => v >= -0.0005 && v <= 1.0005);

function hexToOklch(hex) {
  const [L, a, b] = hexToOklab(hex);
  const C = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C, h };
}

// OKLCH -> hex, reducing chroma (binary search) until the color fits inside sRGB.
function oklchToHex({ L, C, h }) {
  const Lc = clamp(L, 0, 1);
  const rad = (h * Math.PI) / 180;
  const lab = c => [Lc, Math.cos(rad) * c, Math.sin(rad) * c];
  let hi = Math.max(0, C);
  if (!inGamut(lab(hi))) {
    let lo = 0;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(lab(mid))) lo = mid; else hi = mid;
    }
    hi = lo;
  }
  return rgbToHex(oklabToRgbRaw(lab(hi)).map(v => linearToSrgb(clamp(v, 0, 1)) * 255));
}

function relLuminance(hex) {
  const [R, G, B] = hexToRgb(hex).map(v => srgbToLinear(v / 255));
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function contrast(a, b) {
  const [x, y] = [relLuminance(a), relLuminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// Shortest signed distance from h1 to h2 around the hue circle.
function hueDelta(h1, h2) {
  let d = ((h2 - h1 + 540) % 360) - 180;
  return d;
}
const hueDist = (h1, h2) => Math.abs(hueDelta(h1, h2));

// Move `hex` away from `bg` in lightness until it clears `floor:1` contrast.
function enforceContrast(hex, bg, floor) {
  let c = hexToOklch(hex);
  const up = relLuminance(bg) < 0.18;          // dark background -> brighten
  const step = up ? 0.012 : -0.012;
  let out = oklchToHex(c);
  for (let i = 0; i < 90 && contrast(out, bg) < floor; i++) {
    c = { ...c, L: clamp(c.L + step, 0.02, 0.99) };
    out = oklchToHex(c);
    if (c.L <= 0.02 || c.L >= 0.99) break;
  }
  return out;
}

module.exports = {
  clamp, hexToRgb, rgbToHex, hexToOklch, oklchToHex,
  contrast, relLuminance, hueDelta, hueDist, enforceContrast,
};
