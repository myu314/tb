import { parse } from 'yaml';
import { hexToOklch, normalizeHex } from './color';
import {
  ALL_SLOTS,
  BASE16_SLOTS,
  deriveBase24,
  newId,
  slotsOf,
  slugify,
  type Palette,
  type System,
  type Theme,
  type Variant,
} from './scheme';

// ---------- YAML (tinted-theming scheme format) ----------

export function toYaml(t: Theme): string {
  const q = (s: string) => JSON.stringify(s); // JSON strings are valid YAML double-quoted scalars
  const lines = [
    `system: ${q(t.system)}`,
    `name: ${q(t.name)}`,
    `slug: ${q(t.slug || slugify(t.name))}`,
    `author: ${q(t.author)}`,
  ];
  if (t.description) lines.push(`description: ${q(t.description)}`);
  lines.push(`variant: ${q(t.variant)}`, 'palette:');
  for (const s of slotsOf(t.system)) lines.push(`  ${s}: ${q(t.palette[s])}`);
  return lines.join('\n') + '\n';
}

/**
 * Parse both the current spec (system/name/palette:) and the legacy flat format
 * (scheme:/author:/base00: "1d1f21").
 */
export function fromYaml(text: string): Theme {
  const doc = parse(text);
  if (!doc || typeof doc !== 'object') throw new Error('YAML is not a mapping');
  const src: Record<string, unknown> =
    doc.palette && typeof doc.palette === 'object' ? doc.palette : doc;

  const palette: Partial<Palette> = {};
  for (const s of ALL_SLOTS) {
    // Keys may appear as base0A or base0a.
    const raw = src[s] ?? src[s.toLowerCase()];
    if (raw == null) continue;
    const hex = normalizeHex(String(raw));
    if (!hex) throw new Error(`Invalid color for ${s}: ${raw}`);
    palette[s] = hex;
  }
  const missing = BASE16_SLOTS.filter((s) => !palette[s]);
  if (missing.length) throw new Error(`Missing colors: ${missing.join(', ')}`);

  const hasBase24 = ALL_SLOTS.slice(16).every((s) => palette[s]);
  const system: System =
    doc.system === 'base24' || (doc.system == null && hasBase24) ? 'base24' : 'base16';
  const variant: Variant =
    doc.variant === 'light' || doc.variant === 'dark'
      ? doc.variant
      : hexToOklch(palette.base00!).l > 0.5 ? 'light' : 'dark';

  const full = palette as Palette;
  if (!hasBase24) Object.assign(full, deriveBase24(full, variant));

  return {
    id: newId(),
    name: String(doc.name ?? doc.scheme ?? 'Imported'),
    author: String(doc.author ?? ''),
    slug: doc.slug ? String(doc.slug) : undefined,
    description: doc.description ? String(doc.description) : undefined,
    system,
    variant,
    palette: full,
    updatedAt: Date.now(),
  };
}

// ---------- URL share ----------
// Compact format: v1~system~variant~name~author~<hex digits concatenated>

const b64url = {
  enc: (s: string) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(s)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s: string) => {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  },
};

export function encodeShare(t: Theme): string {
  const colors = ALL_SLOTS.map((s) => t.palette[s].slice(1)).join('');
  const parts = ['1', t.system === 'base24' ? '24' : '16', t.variant[0], t.name, t.author, colors, t.description ?? ''];
  return b64url.enc(parts.map((p) => p.replace(/~/g, '-')).join('~'));
}

export function decodeShare(code: string): Theme {
  // The trailing description is optional so that older links still decode.
  const [ver, sys, v, name, author, colors, description] = b64url.dec(code).split('~');
  if (ver !== '1' || !colors || colors.length !== ALL_SLOTS.length * 6) throw new Error('Invalid share code');
  const palette = {} as Palette;
  ALL_SLOTS.forEach((s, i) => (palette[s] = '#' + colors.slice(i * 6, i * 6 + 6)));
  return {
    id: newId(),
    name,
    author,
    description: description || undefined,
    system: sys === '24' ? 'base24' : 'base16',
    variant: v === 'l' ? 'light' : 'dark',
    palette,
    updatedAt: Date.now(),
  };
}

export function shareUrl(t: Theme): string {
  const u = new URL(location.href);
  u.hash = 't=' + encodeShare(t);
  return u.toString();
}

export function downloadText(filename: string, text: string, type = 'text/yaml') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
