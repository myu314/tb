// Color math: sRGB / HSV / OKLab / OKLCH conversions, gamut mapping, contrast.
// All RGB values are in 0..1 unless noted.

export type RGB = { r: number; g: number; b: number };
export type HSV = { h: number; s: number; v: number }; // h: 0..360, s/v: 0..1
export type OKLCH = { l: number; c: number; h: number }; // l: 0..1, c: 0..~0.4, h: 0..360
export type OKLab = { l: number; a: number; b: number };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

// ---------- hex ----------

export function normalizeHex(input: string): string | null {
  let s = input.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(s)) s = s.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/.test(s)) return null;
  return '#' + s;
}

export function hexToRgb(hex: string): RGB {
  const s = (normalizeHex(hex) ?? '#000000').slice(1);
  return {
    r: parseInt(s.slice(0, 2), 16) / 255,
    g: parseInt(s.slice(2, 4), 16) / 255,
    b: parseInt(s.slice(4, 6), 16) / 255,
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const h = (x: number) => Math.round(clamp01(x) * 255).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}

// ---------- HSV ----------

export function rgbToHsv({ r, g, b }: RGB): HSV {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const c = v * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = v - c;
  return { r: r + m, g: g + m, b: b + m };
}

// ---------- OKLab / OKLCH ----------

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const fromLinear = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(c, 0), 1 / 2.4) - 0.055;

export function rgbToOklab({ r, g, b }: RGB): OKLab {
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

/** Returns *unclamped* sRGB (may be outside 0..1 when out of gamut). */
export function oklabToRgbRaw({ l: L, a, b }: OKLab): RGB {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  return {
    r: fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

export function rgbToOklch(rgb: RGB): OKLCH {
  const { l, a, b } = rgbToOklab(rgb);
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l, c, h: c < 1e-4 ? 0 : h };
}

export function oklchToRgbRaw({ l, c, h }: OKLCH): RGB {
  const hr = (h * Math.PI) / 180;
  return oklabToRgbRaw({ l, a: c * Math.cos(hr), b: c * Math.sin(hr) });
}

const EPS = 1e-4;
export function inGamut({ r, g, b }: RGB): boolean {
  return r >= -EPS && r <= 1 + EPS && g >= -EPS && g <= 1 + EPS && b >= -EPS && b <= 1 + EPS;
}

export function oklchInGamut(lch: OKLCH): boolean {
  return inGamut(oklchToRgbRaw(lch));
}

/** Gamut-map by reducing chroma (keeping L and H) until the color fits in sRGB. */
export function gamutMapOklch(lch: OKLCH): OKLCH {
  const l = clamp01(lch.l);
  if (l <= 0) return { l: 0, c: 0, h: lch.h };
  if (l >= 1) return { l: 1, c: 0, h: lch.h };
  if (oklchInGamut({ ...lch, l })) return { ...lch, l };
  let lo = 0, hi = lch.c;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (oklchInGamut({ l, c: mid, h: lch.h })) lo = mid;
    else hi = mid;
  }
  return { l, c: lo, h: lch.h };
}

export function oklchToRgb(lch: OKLCH): RGB {
  const raw = oklchToRgbRaw(gamutMapOklch(lch));
  return { r: clamp01(raw.r), g: clamp01(raw.g), b: clamp01(raw.b) };
}

export const hexToOklch = (hex: string) => rgbToOklch(hexToRgb(hex));
export const oklchToHex = (lch: OKLCH) => rgbToHex(oklchToRgb(lch));
export const hexToHsv = (hex: string) => rgbToHsv(hexToRgb(hex));
export const hsvToHex = (hsv: HSV) => rgbToHex(hsvToRgb(hsv));

/** Max in-gamut chroma at a given lightness / hue. */
export function maxChroma(l: number, h: number): number {
  return gamutMapOklch({ l, c: 0.5, h }).c;
}

export function lerpHue(a: number, b: number, t: number): number {
  let d = ((b - a + 540) % 360) - 180;
  return (a + d * t + 360) % 360;
}

// ---------- contrast ----------

export function relativeLuminance({ r, g, b }: RGB): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG 2.x contrast ratio (1..21). */
export function wcagContrast(fg: string, bg: string): number {
  const a = relativeLuminance(hexToRgb(fg));
  const b = relativeLuminance(hexToRgb(bg));
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

export type WcagLevel = 'AAA' | 'AA' | 'AA18' | 'fail';
export function wcagLevel(ratio: number): WcagLevel {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA18';
  return 'fail';
}

// APCA-W3 0.0.98G-4g (base constants). Returns signed Lc (positive: dark text on light bg).
export function apcaContrast(txt: string, bg: string): number {
  const y = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    return 0.2126729 * r ** 2.4 + 0.7151522 * g ** 2.4 + 0.072175 * b ** 2.4;
  };
  const blkThrs = 0.022, blkClmp = 1.414;
  const clampY = (v: number) => (v > blkThrs ? v : v + Math.pow(blkThrs - v, blkClmp));
  const Yt = clampY(y(txt));
  const Yb = clampY(y(bg));
  if (Math.abs(Yb - Yt) < 0.0005) return 0;
  let out: number;
  if (Yb > Yt) {
    const sapc = (Math.pow(Yb, 0.56) - Math.pow(Yt, 0.57)) * 1.14;
    out = sapc < 0.1 ? 0 : sapc - 0.027;
  } else {
    const sapc = (Math.pow(Yb, 0.65) - Math.pow(Yt, 0.62)) * 1.14;
    out = sapc > -0.1 ? 0 : sapc + 0.027;
  }
  return out * 100;
}

/** Rough APCA usage tiers based on |Lc|. */
export type ApcaTier = 'body' | 'content' | 'large' | 'nontext' | 'fail';
export function apcaTier(lc: number): ApcaTier {
  const a = Math.abs(lc);
  if (a >= 75) return 'body';
  if (a >= 60) return 'content';
  if (a >= 45) return 'large';
  if (a >= 30) return 'nontext';
  return 'fail';
}
