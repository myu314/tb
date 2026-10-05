// Automatic fixes: push apart look-alike accents, and nudge lightness until contrast passes.
import { apcaContrast, clamp, hexToOklch, oklchToHex, wcagContrast, type OKLCH } from './color';
import { DELTA_E, deltaE, distinctSlots, rolePairs, THRESHOLDS, type PairKind } from './contrast';
import { BRIGHT_OF, type Palette, type Slot, type System } from './scheme';

const hueGap = (a: number, b: number) => ((b - a + 540) % 360) - 180; // signed, -180..180

/**
 * Rotate hues of accents that are closer than `target` ΔE away from each other.
 * Lightness and chroma stay put; each hue moves at most `maxShift` degrees so the
 * colors keep their character. Returns only the slots that changed.
 */
export function separateAccents(
  p: Palette,
  system: System,
  opts: { target?: number; maxShift?: number; maxChromaGain?: number; only?: [Slot, Slot] } = {},
): { colors: Partial<Palette>; remaining: number } {
  const target = opts.target ?? DELTA_E.warn;
  const maxShift = opts.maxShift ?? 20;
  const maxGain = opts.maxChromaGain ?? 0.04;
  const slots = distinctSlots(system);
  const orig = new Map<Slot, OKLCH>(slots.map((s) => [s, hexToOklch(p[s])]));
  const cur = new Map<Slot, OKLCH>([...orig].map(([s, c]) => [s, { ...c }]));
  const hex = (s: Slot) => oklchToHex(cur.get(s)!);

  const pairs: [Slot, Slot][] = [];
  if (opts.only) pairs.push(opts.only);
  else
    for (let i = 0; i < slots.length; i++)
      for (let j = i + 1; j < slots.length; j++) {
        const [a, b] = [slots[i], slots[j]];
        if (BRIGHT_OF[a] !== b && BRIGHT_OF[b] !== a) pairs.push([a, b]);
      }

  const close = () => pairs.filter(([a, b]) => deltaE(hex(a), hex(b)) < target);
  for (let iter = 0; iter < 300; iter++) {
    const bad = close();
    if (!bad.length) break;
    for (const [a, b] of bad) {
      const ca = cur.get(a)!, cb = cur.get(b)!;
      // Hue means nothing for near-grays; nothing to rotate.
      if (ca.c < 0.02 && cb.c < 0.02) continue;
      const dir = Math.sign(hueGap(ca.h, cb.h)) || 1;
      for (const [s, c, sign] of [[a, ca, -dir], [b, cb, dir]] as const) {
        if (c.c < 0.02) continue;
        const shift = hueGap(orig.get(s)!.h, c.h + sign);
        if (Math.abs(shift) <= maxShift) c.h = (c.h + sign + 360) % 360;
      }
    }
  }

  // Hue alone can't separate muted colors much (ΔE from hue scales with chroma), so as a
  // second step let the colors of still-close pairs gain a little saturation.
  for (let iter = 0; iter < 100; iter++) {
    const bad = close();
    if (!bad.length) break;
    let moved = false;
    for (const [a, b] of bad)
      for (const s of [a, b]) {
        const c = cur.get(s)!;
        if (c.c < 0.02 || c.c - orig.get(s)!.c >= maxGain) continue;
        const next = { ...c, c: c.c + 0.002 };
        if (oklchToHex(next) === hex(s)) continue; // already at the gamut edge
        cur.set(s, next);
        moved = true;
      }
    if (!moved) break;
  }

  const colors: Partial<Palette> = {};
  for (const s of slots) {
    const h = hex(s);
    if (h !== p[s]) colors[s] = h;
  }
  return { colors, remaining: close().length };
}

export type ContrastMetric = 'wcag' | 'apca' | 'both';

const BG_LIKE: Slot[] = ['base00', 'base01', 'base02', 'base07', 'base10', 'base11'];

function passes(fg: string, bg: string, kind: PairKind, metric: ContrastMetric) {
  const th = THRESHOLDS[kind];
  const w = wcagContrast(fg, bg) >= th.wcag;
  const a = Math.abs(apcaContrast(fg, bg)) >= th.apca;
  return metric === 'wcag' ? w : metric === 'apca' ? a : w && a;
}

/**
 * For every failing role pair whose text is a foreground color, move that color's
 * lightness away from its background(s) just far enough to pass. Backgrounds are left alone.
 */
export function fixContrast(
  p: Palette,
  system: System,
  metric: ContrastMetric = 'both',
): { colors: Partial<Palette>; unfixable: Slot[] } {
  const constraints = new Set<Slot>();
  for (const pair of rolePairs(system)) {
    if (BG_LIKE.includes(pair.fg)) continue;
    if (passes(p[pair.fg], p[pair.bg], pair.kind, metric)) continue;
    constraints.add(pair.fg);
  }

  // Text gets lighter on dark themes and darker on light ones, whatever the individual background.
  const dir = hexToOklch(p.base05).l >= hexToOklch(p.base00).l ? 1 : -1;
  const colors: Partial<Palette> = {};
  const unfixable: Slot[] = [];
  for (const fg of constraints) {
    // Re-check every pair this color takes part in, not only the failing ones.
    const all = rolePairs(system).filter((x) => x.fg === fg && !BG_LIKE.includes(x.fg));
    const start = hexToOklch(p[fg]);
    let found: string | null = null;
    for (let i = 0; i <= 500; i++) {
      const h = oklchToHex({ ...start, l: clamp(start.l + dir * i * 0.002, 0, 1) });
      if (all.every((x) => passes(h, p[x.bg], x.kind, metric))) { found = h; break; }
    }
    if (found && found !== p[fg]) colors[fg] = found;
    else if (!found) unfixable.push(fg);
  }
  return { colors, unfixable };
}
