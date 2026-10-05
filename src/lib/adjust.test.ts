import { describe, expect, it } from 'vitest';
import data from '../data/schemes.json';
import { fixContrast, separateAccents } from './adjust';
import { hexToOklch } from './color';
import { deltaE, distinctPairs, evaluate, rolePairs } from './contrast';
import { entryTheme, type SchemeData } from './presets';

const theme = (slug: string) =>
  entryTheme((data as SchemeData).schemes.find((e) => e.system === 'base16' && e.slug === slug)!);

describe('separateAccents', () => {
  it('pushes a look-alike pair apart without touching lightness much', () => {
    const t = theme('tomorrow-night');
    t.palette.base0C = '#82a6c0'; // almost base0D
    expect(deltaE(t.palette.base0C, t.palette.base0D)).toBeLessThan(8);
    const { colors } = separateAccents(t.palette, t.system, { only: ['base0C', 'base0D'] });
    const p = { ...t.palette, ...colors };
    expect(deltaE(p.base0C, p.base0D)).toBeGreaterThan(deltaE(t.palette.base0C, t.palette.base0D));
    expect(Math.abs(hexToOklch(p.base0C).l - hexToOklch(t.palette.base0C).l)).toBeLessThan(0.01);
  });

  it('does not move hues beyond the limit', () => {
    const t = theme('tomorrow-night');
    t.palette.base0C = t.palette.base0D;
    const { colors } = separateAccents(t.palette, t.system, { maxShift: 10 });
    for (const [s, h] of Object.entries(colors)) {
      const d = Math.abs(((hexToOklch(h!).h - hexToOklch(t.palette[s as 'base08']).h + 540) % 360) - 180);
      expect(d).toBeLessThan(10.5);
    }
  });

  it('leaves an already distinct palette alone', () => {
    const t = theme('gruvbox-dark-medium');
    const before = distinctPairs(t.palette, t.system).filter((x) => x.level !== 'ok').length;
    if (before === 0) expect(separateAccents(t.palette, t.system).colors).toEqual({});
  });
});

describe('fixContrast', () => {
  it('makes failing foreground pairs pass with the chosen metric', () => {
    const t = theme('tomorrow-night');
    t.palette.base08 = '#5a2a2a'; // too dark on the dark background
    const { colors } = fixContrast(t.palette, t.system, 'wcag');
    const p = { ...t.palette, ...colors };
    expect(colors.base08).toBeDefined();
    expect(hexToOklch(p.base08).l).toBeGreaterThan(hexToOklch(t.palette.base08).l);
    for (const x of rolePairs(t.system).filter((x) => x.fg === 'base08'))
      expect(evaluate(p, x.fg, x.bg, x.kind).passWcag).toBe(true);
    // Backgrounds are never changed.
    expect(colors.base00).toBeUndefined();
  });

  it('works for light themes by darkening', () => {
    const t = theme('solarized-light');
    t.palette.base0D = '#c8dcf0';
    const { colors } = fixContrast(t.palette, t.system, 'wcag');
    expect(hexToOklch(colors.base0D!).l).toBeLessThan(hexToOklch('#c8dcf0').l);
  });
});
