<script lang="ts">
  import './previews/preview.css';
  import { apcaContrast, hexToOklch, wcagContrast } from '../lib/color';
  import { t, type Key } from '../lib/i18n';
  import { BRIGHT_OF, effectivePalette, ROLES, shortName, type Slot } from '../lib/scheme';
  import { app } from '../lib/state.svelte';
  import CodePreview from './previews/CodePreview.svelte';
  import FilerPreview from './previews/FilerPreview.svelte';
  import MarkdownPreview from './previews/MarkdownPreview.svelte';
  import TerminalPreview from './previews/TerminalPreview.svelte';
  import TrackerPreview from './previews/TrackerPreview.svelte';

  type Sample = 'code' | 'markdown' | 'terminal' | 'tracker' | 'filer';
  const SAMPLES: Sample[] = ['code', 'markdown', 'terminal', 'tracker', 'filer'];

  const read = (k: string, d: string) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
  let sample = $state<Sample>(read('theme-bench:sample', 'code') as Sample);
  let highlight = $state(read('theme-bench:hl', '1') === '1');
  $effect(() => {
    try {
      localStorage.setItem('theme-bench:sample', sample);
      localStorage.setItem('theme-bench:hl', highlight ? '1' : '0');
    } catch {}
  });

  const pal = $derived(effectivePalette(app.theme));
  const vars = $derived(
    Object.entries(pal).map(([k, v]) => `--${k}: ${v}`).join('; ') +
      `; --hl-ring: ${hexToOklch(pal.base00).l > 0.6 ? '#000' : '#fff'}`,
  );

  // ---------- hover / tap inspection ----------

  let info = $state<{ fg: Slot; bg: Slot } | null>(null);
  const slotFromClass = (el: Element, prefix: 'f' | 'b') => {
    for (const c of el.classList) {
      const m = c.match(prefix === 'f' ? /^f-([0-9A-F]{2})$/ : /^b-([0-9A-F]{2})$/);
      if (m) return ('base' + m[1]) as Slot;
    }
    return null;
  };
  function inspect(target: EventTarget | null): { fg: Slot; bg: Slot } | null {
    let el = target instanceof Element ? target : null;
    let fg: Slot | null = null, bg: Slot | null = null;
    while (el && !el.classList.contains('pv')) {
      fg ??= slotFromClass(el, 'f');
      bg ??= slotFromClass(el, 'b');
      if (fg && bg) break;
      el = el.parentElement;
    }
    if (!fg && !bg) return null;
    return { fg: fg ?? 'base05', bg: bg ?? 'base00' };
  }

  function onMove(e: PointerEvent) {
    if (e.pointerType === 'mouse') info = inspect(e.target);
  }
  function onClick(e: MouseEvent) {
    if ((e.target as Element).closest('button, a')) return;
    const r = inspect(e.target);
    if (!r) return;
    info = r;
    // Tapping on the text picks its color; tapping on bare background picks the background.
    const hasText = (e.target as Element).childNodes.length > 0 && (e.target as Element).textContent?.trim();
    app.selected = editable(hasText ? r.fg : r.bg);
  }

  /** In base16 themes the base24 slots are stand-ins; map them to the slot they mirror. */
  function editable(s: Slot): Slot {
    if (app.theme.system === 'base24') return s;
    if (s === 'base10' || s === 'base11') return 'base00';
    return BRIGHT_OF[s] ?? s;
  }

  const infoText = $derived.by(() => {
    if (!info) return null;
    const fg = editable(info.fg), bg = editable(info.bg);
    return {
      fg, bg,
      wcag: wcagContrast(pal[fg], pal[bg]).toFixed(2),
      apca: Math.abs(apcaContrast(pal[fg], pal[bg])).toFixed(0),
    };
  });
</script>

<section class="preview">
  <div class="tabs" role="tablist">
    {#each SAMPLES as s}
      <button class:on={sample === s} role="tab" aria-selected={sample === s} onclick={() => (sample = s)}>{t(s as Key)}</button>
    {/each}
  </div>

  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    class="pv"
    style={vars}
    data-hl={highlight ? shortName(app.selected) : null}
    onpointermove={onMove}
    onpointerleave={() => (info = null)}
    onclick={onClick}
  >
    {#if sample === 'code'}<CodePreview />
    {:else if sample === 'markdown'}<MarkdownPreview />
    {:else if sample === 'terminal'}<TerminalPreview />
    {:else if sample === 'tracker'}<TrackerPreview />
    {:else}<FilerPreview />{/if}
  </div>

  <div class="info small">
    <label class="hl" title={t('highlight')}>
      <input type="checkbox" bind:checked={highlight} />
      <span>{t('highlight')}</span>
    </label>
    {#if infoText}
      <span class="sw" style:background={pal[infoText.fg]}></span>
      <span class="mono">{shortName(infoText.fg)}</span>
      <span class="muted">{ROLES[infoText.fg].label[app.lang]}</span>
      <span class="muted">on</span>
      <span class="sw" style:background={pal[infoText.bg]}></span>
      <span class="mono">{shortName(infoText.bg)}</span>
      <span class="sp"></span>
      <span class="mono">{infoText.wcag}:1</span>
      <span class="mono">Lc {infoText.apca}</span>
    {:else}
      <span class="muted">{t('tapHint')}</span>
    {/if}
  </div>
</section>

<style>
  .preview { display: flex; flex-direction: column; min-height: 0; height: 100%; }
  .tabs { display: flex; gap: 2px; overflow-x: auto; scrollbar-width: none; flex: none; align-items: center; }
  .tabs button { border: 0; background: transparent; border-radius: 6px 6px 0 0; padding: 4px 10px; white-space: nowrap; color: var(--ui-muted); }
  .tabs button.on { background: var(--ui-panel-2); color: var(--ui-text); font-weight: 600; }
  .hl { display: flex; align-items: center; gap: 4px; white-space: nowrap; padding-right: 8px; margin-right: 2px; border-right: 1px solid var(--ui-border); color: var(--ui-muted); }
  .pv { flex: 1; min-height: 0; overflow: auto; border-radius: 0 6px 6px 6px; box-shadow: inset 0 0 0 1px var(--ui-border); background: var(--base00); cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .info { display: flex; gap: 6px; align-items: center; min-height: 26px; padding: 2px 4px; white-space: nowrap; overflow: hidden; flex: none; }
  .sw { width: 14px; height: 14px; border-radius: 3px; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.4); flex: none; }
  .sp { flex: 1; }
</style>
