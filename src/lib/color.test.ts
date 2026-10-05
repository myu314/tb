import { describe, expect, it } from 'vitest';
import {
  apcaContrast, gamutMapOklch, hexToOklch, hsvToHex, hexToHsv, oklchInGamut, oklchToHex, wcagContrast,
} from './color';

describe('color', () => {
  it('round-trips hex through OKLCH and HSV', () => {
    for (const hex of ['#1d1f21', '#cc6666', '#ffffff', '#000000', '#81a2be', '#00ff00']) {
      expect(oklchToHex(hexToOklch(hex))).toBe(hex);
      expect(hsvToHex(hexToHsv(hex))).toBe(hex);
    }
  });

  it('matches known OKLCH values', () => {
    const c = hexToOklch('#ff0000');
    expect(c.l).toBeCloseTo(0.628, 2);
    expect(c.c).toBeCloseTo(0.2577, 3);
    expect(c.h).toBeCloseTo(29.23, 1);
  });

  it('gamut-maps by reducing chroma', () => {
    const lch = { l: 0.7, c: 0.4, h: 150 };
    expect(oklchInGamut(lch)).toBe(false);
    const m = gamutMapOklch(lch);
    expect(oklchInGamut(m)).toBe(true);
    expect(m.l).toBe(0.7);
    expect(m.c).toBeLessThan(0.4);
  });

  it('computes WCAG contrast', () => {
    expect(wcagContrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(wcagContrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
  });

  it('computes APCA Lc like the reference implementation', () => {
    expect(apcaContrast('#888888', '#ffffff')).toBeCloseTo(63.06, 1);
    expect(apcaContrast('#ffffff', '#888888')).toBeCloseTo(-68.54, 1);
    expect(apcaContrast('#000000', '#aaaaaa')).toBeCloseTo(58.15, 1);
  });
});
