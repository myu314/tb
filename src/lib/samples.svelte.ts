// User-defined preview samples: an HTML mock-up or a light text markup, stored per device.

export type SampleFormat = 'html' | 'text';
export interface CustomSample { id: string; name: string; format: SampleFormat; source: string }

const SLOT = /^(?:base)?([0-9a-f]{2})$/i;
const VALID = new Set([...Array.from({ length: 16 }, (_, i) => i.toString(16).padStart(2, '0').toUpperCase()), '10', '11', '12', '13', '14', '15', '16', '17']);

/** "08", "base0a", "0A" → "0A"; anything else → null. */
export function slotCode(s: string): string | null {
  const m = s.trim().match(SLOT);
  if (!m) return null;
  const code = m[1].toUpperCase();
  return VALID.has(code) ? code : null;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Text markup → HTML using the preview color classes.
 *   {08:text}      text in base08
 *   {08/01:text}   base08 on base01        {/02:text}  background only
 *   @01 at the start of a line paints the whole line with base01
 *   !fg 05 / !bg 00 on their own lines set the defaults
 *   \{ \} \\ escape. Spans can nest. Unknown slots are shown as plain text.
 */
export function textToHtml(src: string): { html: string; fg: string; bg: string } {
  let fg = '05';
  let bg = '00';
  const out: string[] = [];
  for (const raw of src.replace(/\r\n?/g, '\n').split('\n')) {
    const directive = raw.match(/^!(fg|bg)\s+(\S+)\s*$/i);
    if (directive) {
      const code = slotCode(directive[2]);
      if (code) directive[1].toLowerCase() === 'fg' ? (fg = code) : (bg = code);
      continue;
    }
    let line = raw;
    let lineBg: string | null = null;
    const lb = line.match(/^@([0-9a-z]{2,6})\s?/i);
    if (lb && slotCode(lb[1])) {
      lineBg = slotCode(lb[1]);
      line = line.slice(lb[0].length);
    }
    const body = renderSpans(line);
    out.push(`<div class="ln${lineBg ? ` b-${lineBg}` : ''}">${body || ' '}</div>`);
  }
  return { html: out.join(''), fg, bg };
}

function renderSpans(line: string): string {
  let html = '';
  let depth = 0;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '\\' && i + 1 < line.length && '{}\\'.includes(line[i + 1])) {
      html += esc(line[++i]);
    } else if (c === '{') {
      const m = line.slice(i + 1).match(/^([0-9a-z]{0,6})(?:\/([0-9a-z]{2,6}))?:/i);
      const f = m?.[1] ? slotCode(m[1]) : null;
      const b = m?.[2] ? slotCode(m[2]) : null;
      if (m && (f || b) && (!m[1] || f) && (!m[2] || b)) {
        const cls = [f && `f-${f}`, b && `b-${b}`].filter(Boolean).join(' ');
        html += `<span class="${cls}">`;
        depth++;
        i += m[0].length;
      } else {
        html += '{';
      }
    } else if (c === '}' && depth > 0) {
      html += '</span>';
      depth--;
    } else {
      html += esc(c);
    }
  }
  return html + '</span>'.repeat(depth);
}

// ---------- HTML sanitizing (the mock-up is rendered in a shadow root) ----------

const DROP_TAGS = ['script', 'iframe', 'frame', 'frameset', 'object', 'embed', 'link', 'meta', 'base', 'form', 'noscript', 'template'];

/** Remove anything that could run code; layout and styling stay. */
export function sanitizeHtml(src: string): string {
  const doc = new DOMParser().parseFromString(`<body>${src}</body>`, 'text/html');
  doc.querySelectorAll(DROP_TAGS.join(',')).forEach((el) => el.remove());
  doc.body.querySelectorAll('*').forEach((el) => {
    for (const a of [...el.attributes]) {
      const name = a.name.toLowerCase();
      const value = a.value.trim().toLowerCase();
      if (name.startsWith('on')) el.removeAttribute(a.name);
      else if (['href', 'src', 'xlink:href', 'action', 'formaction'].includes(name) && /^(javascript|vbscript|data:text\/html)/.test(value.replace(/\s+/g, ''))) {
        el.removeAttribute(a.name);
      }
    }
  });
  // <style> may also arrive inside <head> when the source is a full document.
  const styles = [...doc.head.querySelectorAll('style')].map((s) => s.outerHTML).join('');
  return styles + doc.body.innerHTML;
}

// ---------- starters shown when creating a sample ----------

export const STARTERS: Record<SampleFormat, string> = {
  text: [
    '!bg 00',
    '!fg 05',
    '@01 {05: main.rs }{03:│}{04: notes.md }',
    '{03:  1 }{0E:fn} {0D:main}() \\{',
    '{03:  2 }    {0E:let} {08:name} = {0B:"world"};',
    '@01{04:  3 }    {0D:println!}({0B:"hello, \\{\\}"}, {08:name});{/05: }',
    '{03:  4 }\\}',
    '',
    '@01{00/0D: NORMAL } {05:main.rs} {03:utf-8} {0A:3:42}',
  ].join('\n'),
  html: `<style>
  .ed { font: 13px/1.6 ui-monospace, monospace; height: 100%; display: flex; flex-direction: column; }
  .tabs, .status { display: flex; gap: 12px; padding: 2px 10px; }
  .body { flex: 1; padding: 6px 0; }
  .ln { white-space: pre; }
  .gut { display: inline-block; width: 3em; text-align: right; padding-right: 10px; }
</style>
<div class="ed b-00 f-05">
  <div class="tabs b-01"><span class="f-05">main.rs</span><span class="f-04">notes.md</span></div>
  <div class="body">
    <div class="ln"><span class="gut f-03">1</span><span class="f-0E">fn</span> <span class="f-0D">main</span>() {</div>
    <div class="ln b-01"><span class="gut f-04">2</span>    <span class="f-0E">let</span> <span class="f-08">name</span> = <span class="f-0B">"world"</span>;</div>
    <div class="ln"><span class="gut f-03">3</span>}</div>
  </div>
  <div class="status b-01 f-04"><span class="b-0D f-00">&nbsp;NORMAL&nbsp;</span><span>main.rs</span><span style="color: var(--base0A)">3:42</span></div>
</div>`,
};

// ---------- store ----------

const KEY = 'theme-bench:samples:v1';
const uid = () => Math.random().toString(36).slice(2, 10);

function parse(list: unknown): CustomSample[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((s) => s && typeof s.name === 'string' && typeof s.source === 'string' && (s.format === 'html' || s.format === 'text'))
    .map((s) => ({ id: typeof s.id === 'string' ? s.id : uid(), name: s.name, format: s.format, source: s.source }));
}

/** A bundle of samples as written by exportBundle(). */
export function parseBundle(text: string): CustomSample[] {
  const data = JSON.parse(text);
  if (data?.format !== 'theme-bench-samples') throw new Error('Not a Theme Bench sample file');
  return parse(data.samples).map((s) => ({ ...s, id: uid() }));
}

export function exportBundle(samples: CustomSample[]): string {
  return JSON.stringify({ format: 'theme-bench-samples', version: 1, samples }, null, 2) + '\n';
}

class SampleStore {
  list = $state<CustomSample[]>([]);

  constructor() {
    try { this.list = parse(JSON.parse(localStorage.getItem(KEY) ?? '[]')); } catch {}
  }

  #save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.list)); } catch {}
  }

  get(id: string) { return this.list.find((s) => s.id === id); }

  /** Insert or update; returns the id. */
  put(s: Omit<CustomSample, 'id'> & { id?: string }): string {
    const id = s.id ?? uid();
    const next = { ...s, id };
    const i = this.list.findIndex((x) => x.id === id);
    if (i >= 0) this.list[i] = next;
    else this.list.push(next);
    this.#save();
    return id;
  }

  remove(id: string) {
    this.list = this.list.filter((s) => s.id !== id);
    this.#save();
  }

  addAll(samples: CustomSample[]) {
    this.list.push(...samples);
    this.#save();
  }
}

export const samples = new SampleStore();
