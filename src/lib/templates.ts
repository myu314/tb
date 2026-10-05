import { oklchToHex } from './color';
import {
  ACCENT_SLOTS, ALL_SLOTS, BRIGHT_SLOTS, GRAY_SLOTS, deriveBase24, newId,
  type Palette, type System, type Theme, type Variant,
} from './scheme';

export type TemplateKind = 'black' | 'white' | 'basic' | 'grays';
export const TEMPLATE_KINDS: TemplateKind[] = ['black', 'white', 'basic', 'grays'];

const fill = (hex: string) => Object.fromEntries(ALL_SLOTS.map((s) => [s, hex])) as Palette;

/** Grays ordered so base00 is the background for the variant (dark: black first, light: white first). */
const oriented = (grays: string[], variant: Variant) => (variant === 'dark' ? grays : [...grays].reverse());

// sRGB-even steps from black to white, and the "obvious default" primaries.
const BASIC_GRAYS = ['000000', '242424', '494949', '6d6d6d', '929292', 'b6b6b6', 'dbdbdb', 'ffffff'];
const BASIC_ACCENTS = ['ff0000', 'ff8000', 'ffff00', '00ff00', '00ffff', '0000ff', 'ff00ff', '804000'];
const BASIC_BRIGHTS = ['ff8080', 'ffff80', '80ff80', '80ffff', '8080ff', 'ff80ff']; // base12–17

export function templatePalette(kind: TemplateKind, variant: Variant): Palette {
  if (kind === 'black') return fill('#000000');
  if (kind === 'white') return fill('#ffffff');

  const p = fill('#000000');
  if (kind === 'basic') {
    oriented(BASIC_GRAYS, variant).forEach((c, i) => (p[GRAY_SLOTS[i]] = '#' + c));
    BASIC_ACCENTS.forEach((c, i) => (p[ACCENT_SLOTS[i]] = '#' + c));
    BASIC_BRIGHTS.forEach((c, i) => (p[BRIGHT_SLOTS[i]] = '#' + c));
    // Nothing is darker than black (or lighter than white), so the extra backgrounds match base00.
    p.base10 = p.base11 = p.base00;
    return p;
  }

  // grays: a neutral ramp evenly spaced in OKLCH lightness, accents parked on one mid gray.
  const ramp = GRAY_SLOTS.map((_, i) => oklchToHex({ l: 0.2 + (0.77 * i) / 7, c: 0, h: 0 }).slice(1));
  oriented(ramp, variant).forEach((c, i) => (p[GRAY_SLOTS[i]] = '#' + c));
  const mid = oklchToHex({ l: variant === 'dark' ? 0.68 : 0.5, c: 0, h: 0 });
  for (const s of ACCENT_SLOTS) p[s] = mid;
  Object.assign(p, deriveBase24(p, variant));
  return p;
}

export function blankTheme(opts: {
  kind: TemplateKind; system: System; variant: Variant; name: string; author: string;
}): Theme {
  return {
    id: newId(),
    name: opts.name,
    author: opts.author,
    system: opts.system,
    variant: opts.variant,
    palette: templatePalette(opts.kind, opts.variant),
    updatedAt: Date.now(),
  };
}
