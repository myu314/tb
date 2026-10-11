// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { exportBundle, parseBundle, sanitizeHtml, slotCode, STARTERS, textToHtml } from './samples.svelte';

describe('slotCode', () => {
  it('normalizes slot names', () => {
    expect(slotCode('08')).toBe('08');
    expect(slotCode('base0a')).toBe('0A');
    expect(slotCode('17')).toBe('17');
    expect(slotCode('18')).toBeNull();
    expect(slotCode('red')).toBeNull();
  });
});

describe('textToHtml', () => {
  it('colors spans, nests, and paints line backgrounds', () => {
    const { html } = textToHtml('@01 {08:a} {08/02:b} {/03:c{0D:d}}');
    expect(html).toBe(
      '<div class="ln b-01"><span class="f-08">a</span> <span class="f-08 b-02">b</span> <span class="b-03">c<span class="f-0D">d</span></span></div>',
    );
  });

  it('escapes HTML and braces, and leaves unknown slots as text', () => {
    const { html } = textToHtml('\\{x\\} <b> {zz:no} }');
    expect(html).toBe('<div class="ln">{x} &lt;b&gt; {zz:no} }</div>');
  });

  it('reads default colors and closes unbalanced spans', () => {
    const r = textToHtml('!fg 06\n!bg base01\n{08:open');
    expect(r.fg).toBe('06');
    expect(r.bg).toBe('01');
    expect(r.html).toBe('<div class="ln"><span class="f-08">open</span></div>');
  });

  it('renders the starter without leftovers', () => {
    expect(textToHtml(STARTERS.text).html).not.toMatch(/\{[0-9A-F]{2}[:/]/);
  });
});

describe('sanitizeHtml', () => {
  it('drops scripts and event handlers but keeps styling', () => {
    const out = sanitizeHtml(
      '<style>.a{color:red}</style><div class="f-08" onclick="x()" style="color:var(--base08)">hi</div><script>alert(1)</script><a href="javascript:alert(1)">x</a><img src=x onerror=alert(1)>',
    );
    expect(out).toContain('<style>.a{color:red}</style>');
    expect(out).toContain('class="f-08"');
    expect(out).toContain('style="color:var(--base08)"');
    expect(out).not.toMatch(/script|onclick|onerror|javascript:/i);
  });

  it('keeps styles from a full document head', () => {
    const out = sanitizeHtml('<html><head><style>p{}</style></head><body><p>x</p></body></html>');
    expect(out).toContain('<style>p{}</style>');
    expect(out).toContain('<p>x</p>');
  });
});

describe('bundles', () => {
  it('round-trips and rejects other files', () => {
    const text = exportBundle([{ id: 'a', name: 'Ed', format: 'text', source: '{08:x}' }]);
    const back = parseBundle(text);
    expect(back).toHaveLength(1);
    expect(back[0]).toMatchObject({ name: 'Ed', format: 'text', source: '{08:x}' });
    expect(back[0].id).not.toBe('a'); // imported copies get fresh ids
    expect(() => parseBundle('{"samples":[]}')).toThrow();
  });
});
