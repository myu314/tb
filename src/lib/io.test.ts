import { describe, expect, it } from 'vitest';
import { decodeShare, encodeShare, fromYaml, toYaml } from './io';
import { presetTheme } from './presets';

describe('io', () => {
  it('round-trips YAML', () => {
    for (const i of [0, 7]) {
      const t = presetTheme(i);
      const back = fromYaml(toYaml(t));
      expect(back.system).toBe(t.system);
      expect(back.variant).toBe(t.variant);
      expect(back.name).toBe(t.name);
      if (t.system === 'base24') expect(back.palette).toEqual(t.palette);
      else expect(back.palette.base0F).toBe(t.palette.base0F);
    }
  });

  it('parses the legacy flat format', () => {
    const t = fromYaml(`scheme: "Old"\nauthor: "me"\n` +
      Array.from({ length: 16 }, (_, i) => `base0${i.toString(16).toUpperCase()}: "${'1d1f21'}"`).join('\n'));
    expect(t.name).toBe('Old');
    expect(t.system).toBe('base16');
    expect(t.palette.base0A).toBe('#1d1f21');
    expect(t.palette.base17).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('rejects incomplete palettes', () => {
    expect(() => fromYaml('system: base16\npalette:\n  base00: "#000000"\n')).toThrow(/Missing/);
  });

  it('round-trips share codes including non-ASCII names', () => {
    const t = { ...presetTheme(1), name: '夜のテーマ~test', author: 'みゅう' };
    const back = decodeShare(encodeShare(t));
    expect(back.name).toBe('夜のテーマ-test');
    expect(back.author).toBe('みゅう');
    expect(back.palette).toEqual(t.palette);
  });
});
