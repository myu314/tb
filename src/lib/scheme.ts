import {
  clamp,
  gamutMapOklch,
  hexToOklch,
  lerpHue,
  oklchToHex,
  type OKLCH,
} from './color';

export type System = 'base16' | 'base24';
export type Variant = 'dark' | 'light';

export const BASE16_SLOTS = [
  'base00', 'base01', 'base02', 'base03', 'base04', 'base05', 'base06', 'base07',
  'base08', 'base09', 'base0A', 'base0B', 'base0C', 'base0D', 'base0E', 'base0F',
] as const;
export const BASE24_EXTRA = [
  'base10', 'base11', 'base12', 'base13', 'base14', 'base15', 'base16', 'base17',
] as const;
export const ALL_SLOTS = [...BASE16_SLOTS, ...BASE24_EXTRA] as const;
export type Slot = (typeof ALL_SLOTS)[number];

export const GRAY_SLOTS: Slot[] = ['base00', 'base01', 'base02', 'base03', 'base04', 'base05', 'base06', 'base07'];
export const ACCENT_SLOTS: Slot[] = ['base08', 'base09', 'base0A', 'base0B', 'base0C', 'base0D', 'base0E', 'base0F'];
export const BRIGHT_SLOTS: Slot[] = ['base12', 'base13', 'base14', 'base15', 'base16', 'base17'];
/** base24 bright slot → the base16 accent it brightens. */
export const BRIGHT_OF: Record<string, Slot> = {
  base12: 'base08', base13: 'base0A', base14: 'base0B',
  base15: 'base0C', base16: 'base0D', base17: 'base0E',
};

export type Palette = Record<Slot, string>;

export interface Theme {
  id: string;
  name: string;
  author: string;
  slug?: string;
  description?: string;
  system: System;
  variant: Variant;
  palette: Palette;
  updatedAt: number;
  /** Set when the theme was created from a published scheme, to keep its credit. */
  basedOn?: { name: string; author: string; system: System; slug: string };
}

export const slotsOf = (system: System): readonly Slot[] =>
  system === 'base24' ? ALL_SLOTS : BASE16_SLOTS;

export const shortName = (slot: Slot) => slot.slice(4); // "base0A" -> "0A"

// ---------- role descriptions ----------

export type Lang = 'ja' | 'en';
interface RoleInfo { label: Record<Lang, string>; uses: Record<Lang, string>; }

export const ROLES: Record<Slot, RoleInfo> = {
  base00: { label: { ja: '背景', en: 'Background' }, uses: { ja: 'デフォルト背景', en: 'Default background' } },
  base01: { label: { ja: '明るい背景', en: 'Lighter bg' }, uses: { ja: 'ステータスバー・行番号・折りたたみ', en: 'Status bars, line numbers, folding marks' } },
  base02: { label: { ja: '選択背景', en: 'Selection bg' }, uses: { ja: '選択範囲・カーソル行', en: 'Selection background' } },
  base03: { label: { ja: 'コメント', en: 'Comments' }, uses: { ja: 'コメント・不可視文字・行ハイライト', en: 'Comments, invisibles, line highlighting' } },
  base04: { label: { ja: '暗い前景', en: 'Dark fg' }, uses: { ja: 'ステータスバーの文字', en: 'Status bar text' } },
  base05: { label: { ja: '前景', en: 'Foreground' }, uses: { ja: '本文・キャレット・区切り・演算子', en: 'Default text, caret, delimiters, operators' } },
  base06: { label: { ja: '明るい前景', en: 'Light fg' }, uses: { ja: '強調前景（あまり使われない）', en: 'Light foreground (rarely used)' } },
  base07: { label: { ja: '最も明るい', en: 'Light bg' }, uses: { ja: '明るい背景（あまり使われない）', en: 'Light background (rarely used)' } },
  base08: { label: { ja: '赤', en: 'Red' }, uses: { ja: '変数・XMLタグ・リンク文字・リスト・diff 削除', en: 'Variables, XML tags, link text, lists, diff deleted' } },
  base09: { label: { ja: '橙', en: 'Orange' }, uses: { ja: '数値・真偽値・定数・XML属性・リンクURL', en: 'Integers, booleans, constants, XML attributes, link URL' } },
  base0A: { label: { ja: '黄', en: 'Yellow' }, uses: { ja: 'クラス・太字・検索ハイライト背景', en: 'Classes, bold, search text background' } },
  base0B: { label: { ja: '緑', en: 'Green' }, uses: { ja: '文字列・継承クラス・インラインコード・diff 追加', en: 'Strings, inherited class, markup code, diff inserted' } },
  base0C: { label: { ja: 'シアン', en: 'Cyan' }, uses: { ja: 'サポート・正規表現・エスケープ・引用', en: 'Support, regex, escape chars, quotes' } },
  base0D: { label: { ja: '青', en: 'Blue' }, uses: { ja: '関数・メソッド・属性ID・見出し', en: 'Functions, methods, attribute IDs, headings' } },
  base0E: { label: { ja: '紫', en: 'Magenta' }, uses: { ja: 'キーワード・ストレージ・セレクタ・斜体・diff 変更', en: 'Keywords, storage, selector, italic, diff changed' } },
  base0F: { label: { ja: '茶', en: 'Brown' }, uses: { ja: '非推奨・埋め込み言語タグ', en: 'Deprecated, embedded language tags' } },
  base10: { label: { ja: 'より暗い背景', en: 'Darker bg' }, uses: { ja: 'サイドバー・非アクティブ領域', en: 'Darker background' } },
  base11: { label: { ja: '最も暗い背景', en: 'Darkest bg' }, uses: { ja: 'パネル外枠・最奥の背景', en: 'Darkest background' } },
  base12: { label: { ja: '明るい赤', en: 'Bright red' }, uses: { ja: 'ターミナル明色・強調エラー', en: 'Terminal bright red' } },
  base13: { label: { ja: '明るい黄', en: 'Bright yellow' }, uses: { ja: 'ターミナル明色・強調警告', en: 'Terminal bright yellow' } },
  base14: { label: { ja: '明るい緑', en: 'Bright green' }, uses: { ja: 'ターミナル明色・強調成功', en: 'Terminal bright green' } },
  base15: { label: { ja: '明るいシアン', en: 'Bright cyan' }, uses: { ja: 'ターミナル明色', en: 'Terminal bright cyan' } },
  base16: { label: { ja: '明るい青', en: 'Bright blue' }, uses: { ja: 'ターミナル明色', en: 'Terminal bright blue' } },
  base17: { label: { ja: '明るい紫', en: 'Bright magenta' }, uses: { ja: 'ターミナル明色', en: 'Terminal bright magenta' } },
};

// ---------- base24 derivation ----------

/** Fill base10–base17 from the base16 colors (dark: darker bg / brighter accents; light: the reverse). */
export function deriveBase24(p: Palette, variant: Variant): Pick<Palette, (typeof BASE24_EXTRA)[number]> {
  const bg = hexToOklch(p.base00);
  const dir = variant === 'dark' ? -1 : 1; // direction away from foreground
  const shiftBg = (d: number) => oklchToHex({ ...bg, l: clamp(bg.l + dir * d, 0, 1) });
  const bright = (slot: Slot) => {
    const c = hexToOklch(p[slot]);
    const l = variant === 'dark' ? c.l + (1 - c.l) * 0.3 : c.l * 0.85;
    return oklchToHex(gamutMapOklch({ l, c: c.c * 1.08, h: c.h }));
  };
  return {
    base10: shiftBg(0.03),
    base11: shiftBg(0.06),
    base12: bright('base08'),
    base13: bright('base0A'),
    base14: bright('base0B'),
    base15: bright('base0C'),
    base16: bright('base0D'),
    base17: bright('base0E'),
  };
}

/**
 * Palette used for rendering. base16 themes get base24 slots filled per the base16
 * convention (bright = normal, darker bg = bg) so previews behave as real apps would.
 */
export function effectivePalette(t: Theme): Palette {
  if (t.system === 'base24') return t.palette;
  const p = { ...t.palette };
  p.base10 = p.base00;
  p.base11 = p.base00;
  for (const [b, n] of Object.entries(BRIGHT_OF)) p[b as Slot] = p[n];
  return p;
}

// ---------- generators ----------

/** Interpolate base01–base06 between base00 and base07 in OKLCH. */
export function grayRamp(p: Palette, easing = 1): Partial<Palette> {
  const a = hexToOklch(p.base00);
  const b = hexToOklch(p.base07);
  // Hue of a near-neutral endpoint is meaningless; borrow the other one's.
  const ha = a.c < 0.005 ? b.h : a.h;
  const hb = b.c < 0.005 ? a.h : b.h;
  const out: Partial<Palette> = {};
  for (let i = 1; i <= 6; i++) {
    const t = Math.pow(i / 7, easing);
    const lch: OKLCH = {
      l: a.l + (b.l - a.l) * t,
      c: a.c + (b.c - a.c) * t,
      h: lerpHue(ha, hb, t),
    };
    out[GRAY_SLOTS[i]] = oklchToHex(lch);
  }
  return out;
}

export function accentStats(p: Palette, slots: Slot[] = ACCENT_SLOTS) {
  const lchs = slots.map((s) => hexToOklch(p[s]));
  return {
    l: lchs.reduce((a, c) => a + c.l, 0) / lchs.length,
    c: lchs.reduce((a, c) => a + c.c, 0) / lchs.length,
  };
}

/** Set lightness and/or chroma of the given slots, keeping each hue. */
export function normalizeAccents(
  p: Palette,
  slots: Slot[],
  opts: { l?: number; c?: number },
): Partial<Palette> {
  const out: Partial<Palette> = {};
  for (const s of slots) {
    const cur = hexToOklch(p[s]);
    out[s] = oklchToHex({ l: opts.l ?? cur.l, c: opts.c ?? cur.c, h: cur.h });
  }
  return out;
}

/** Make a light theme from a dark one (or vice versa) as a starting point. */
export function invertVariant(t: Theme): { palette: Palette; variant: Variant } {
  const p = { ...t.palette };
  const flipL = (hex: string) => {
    const c = hexToOklch(hex);
    return oklchToHex({ ...c, l: clamp(1 - c.l, 0, 1) });
  };
  for (const s of [...GRAY_SLOTS, 'base10', 'base11'] as Slot[]) p[s] = flipL(t.palette[s]);
  const toLight = t.variant === 'dark';
  for (const s of [...ACCENT_SLOTS, ...BRIGHT_SLOTS]) {
    const c = hexToOklch(t.palette[s]);
    // Accents should keep their distance from the new background.
    const l = toLight ? clamp(1.12 - c.l, 0.35, 0.65) : clamp(1.12 - c.l, 0.6, 0.85);
    p[s] = oklchToHex({ ...c, l });
  }
  return { palette: p, variant: toLight ? 'light' : 'dark' };
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function slugify(name: string): string {
  return name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled';
}
