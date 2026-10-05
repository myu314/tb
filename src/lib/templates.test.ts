import { describe, expect, it } from 'vitest';
import { hexToOklch } from './color';
import { ALL_SLOTS } from './scheme';
import { blankTheme, templatePalette, TEMPLATE_KINDS } from './templates';

describe('templates', () => {
  it('fill every slot with valid hex', () => {
    for (const kind of TEMPLATE_KINDS)
      for (const v of ['dark', 'light'] as const) {
        const p = templatePalette(kind, v);
        for (const s of ALL_SLOTS) expect(p[s]).toMatch(/^#[0-9a-f]{6}$/);
      }
  });

  it('are blank for black / white', () => {
    expect(new Set(Object.values(templatePalette('black', 'dark')))).toEqual(new Set(['#000000']));
    expect(new Set(Object.values(templatePalette('white', 'light')))).toEqual(new Set(['#ffffff']));
  });

  it('use obvious defaults and orient grays by variant', () => {
    const d = templatePalette('basic', 'dark');
    const l = templatePalette('basic', 'light');
    expect([d.base00, d.base07, d.base08, d.base0D]).toEqual(['#000000', '#ffffff', '#ff0000', '#0000ff']);
    expect([l.base00, l.base07, l.base08]).toEqual(['#ffffff', '#000000', '#ff0000']);
  });

  it('make a monotonic neutral ramp for grays', () => {
    const p = templatePalette('grays', 'dark');
    const ls = ['base00', 'base01', 'base02', 'base03', 'base04', 'base05', 'base06', 'base07'].map(
      (s) => hexToOklch(p[s as 'base00']).l,
    );
    for (let i = 1; i < ls.length; i++) expect(ls[i]).toBeGreaterThan(ls[i - 1]);
    expect(hexToOklch(p.base08).c).toBeLessThan(0.01);
    expect(hexToOklch(templatePalette('grays', 'light').base00).l).toBeGreaterThan(0.9);
  });

  it('builds a theme with the given metadata', () => {
    const t = blankTheme({ kind: 'basic', system: 'base24', variant: 'light', name: 'X', author: 'me' });
    expect(t).toMatchObject({ name: 'X', author: 'me', system: 'base24', variant: 'light' });
    expect(t.basedOn).toBeUndefined();
  });
});
