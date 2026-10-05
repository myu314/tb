import { describe, expect, it } from 'vitest';
import data from '../data/schemes.json';
import { decodeShare, encodeShare, fromYaml, toYaml } from './io';
import { DEFAULT_ENTRY, entryTheme, themeFromEntry, type SchemeData } from './presets';

const schemes = (data as SchemeData).schemes;
const find = (system: string, slug: string) => schemes.find((e) => e.system === system && e.slug === slug)!;

describe('bundled schemes', () => {
  it('are well-formed and credited', () => {
    expect(schemes.length).toBeGreaterThan(500);
    for (const e of schemes) {
      expect(e.colors).toMatch(e.system === 'base24' ? /^[0-9a-f]{144}$/ : /^[0-9a-f]{96}$/);
      expect(e.name).not.toBe('');
    }
    // Authors are kept verbatim; upstream leaves very few blank.
    expect(schemes.filter((e) => !e.author).length).toBeLessThan(3);
  });

  it('omits "by" in the credit when the author is unknown', () => {
    const t = themeFromEntry(find('base16', 'seti'));
    expect(t.description).toBe('Based on "Seti UI" (base16)');
  });

  it('match the built-in default', () => {
    const t = find('base16', 'tomorrow-night');
    expect(t.colors).toBe(DEFAULT_ENTRY.colors);
    expect(t.author).toBe(DEFAULT_ENTRY.author);
  });

  it('record a credit when used as a base', () => {
    const t = themeFromEntry(find('base16', 'nord'));
    expect(t.description).toBe('Based on "Nord" (base16) by arcticicestudio');
    expect(t.basedOn).toMatchObject({ name: 'Nord', slug: 'nord' });
    expect(toYaml(t)).toContain('description: "Based on \\"Nord\\" (base16) by arcticicestudio"');
  });
});

describe('io', () => {
  it('round-trips YAML', () => {
    for (const e of [find('base16', 'tomorrow-night'), find('base24', 'dracula')]) {
      const t = entryTheme(e);
      const back = fromYaml(toYaml(t));
      expect(back.system).toBe(t.system);
      expect(back.variant).toBe(t.variant);
      expect(back.name).toBe(t.name);
      expect(back.author).toBe(t.author);
      if (t.system === 'base24') expect(back.palette).toEqual(t.palette);
      else expect(back.palette.base0F).toBe(t.palette.base0F);
    }
  });

  it('parses the legacy flat format', () => {
    const t = fromYaml(`scheme: "Old"\nauthor: "me"\n` +
      Array.from({ length: 16 }, (_, i) => `base0${i.toString(16).toUpperCase()}: "1d1f21"`).join('\n'));
    expect(t.name).toBe('Old');
    expect(t.system).toBe('base16');
    expect(t.palette.base0A).toBe('#1d1f21');
    expect(t.palette.base17).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('rejects incomplete palettes', () => {
    expect(() => fromYaml('system: base16\npalette:\n  base00: "#000000"\n')).toThrow(/Missing/);
  });

  it('round-trips share codes including non-ASCII names and credits', () => {
    const t = { ...themeFromEntry(find('base16', 'gruvbox-dark-medium')), name: '夜のテーマ~test', author: 'みゅう' };
    const back = decodeShare(encodeShare(t));
    expect(back.name).toBe('夜のテーマ-test');
    expect(back.author).toBe('みゅう');
    expect(back.description).toBe(t.description);
    expect(back.palette).toEqual(t.palette);
  });
});
