<script lang="ts">
  import './previews/preview.css';
  import { apcaContrast, wcagContrast } from '../lib/color';
  import { t, type Key } from '../lib/i18n';
  import { previewVars } from '../lib/preview';
  import { BRIGHT_OF, effectivePalette, ROLES, shortName, type Slot, type System } from '../lib/scheme';
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

  let compare = $state(read('theme-bench:compare', '1') === '1');
  $effect(() => {
    try { localStorage.setItem('theme-bench:compare', compare ? '1' : '0'); } catch {}
  });
  const showRef = $derived(compare && !!app.reference);

  type Pane = 'mine' | 'ref';
  const vars = $derived(previewVars(app.theme));
  const refVars = $derived(app.reference ? previewVars(app.reference) : '');
  const palOf = (pane: Pane) => effectivePalette(pane === 'ref' && app.reference ? app.reference : app.theme);

  // ---------- hover / tap inspection ----------

  let info = $state<{ fg: Slot; bg: Slot; pane: Pane } | null>(null);
  const slotFromClass = (el: Element, prefix: 'f' | 'b') => {
    for (const c of el.classList) {
      const m = c.match(prefix === 'f' ? /^f-([0-9A-F]{2})$/ : /^b-([0-9A-F]{2})$/);
      if (m) return ('base' + m[1]) as Slot;
    }
    return null;
  };
  function inspect(target: EventTarget | null, pane: Pane): { fg: Slot; bg: Slot; pane: Pane } | null {
    let el = target instanceof Element ? target : null;
    let fg: Slot | null = null, bg: Slot | null = null;
    while (el && !el.classList.contains('pv')) {
      fg ??= slotFromClass(el, 'f');
      bg ??= slotFromClass(el, 'b');
      if (fg && bg) break;
      el = el.parentElement;
    }
    if (!fg && !bg) return null;
    return { fg: fg ?? 'base05', bg: bg ?? 'base00', pane };
  }

  function onMove(e: PointerEvent, pane: Pane) {
    if (e.pointerType === 'mouse') info = inspect(e.target, pane);
  }
  function onClick(e: MouseEvent, pane: Pane) {
    if ((e.target as Element).closest('button, a')) return;
    const r = inspect(e.target, pane);
    if (!r) return;
    info = r;
    // Tapping on the text picks its color; tapping on bare background picks the background.
    const hasText = (e.target as Element).childNodes.length > 0 && (e.target as Element).textContent?.trim();
    app.selected = editable(hasText ? r.fg : r.bg, app.theme.system);
  }

  /** In base16 themes the base24 slots are stand-ins; map them to the slot they mirror. */
  function editable(s: Slot, system: System): Slot {
    if (system === 'base24') return s;
    if (s === 'base10' || s === 'base11') return 'base00';
    return BRIGHT_OF[s] ?? s;
  }

  const infoText = $derived.by(() => {
    if (!info) return null;
    const system = info.pane === 'ref' && app.reference ? app.reference.system : app.theme.system;
    const fg = editable(info.fg, system), bg = editable(info.bg, system);
    const pal = palOf(info.pane);
    return {
      fg, bg, pal, ref: info.pane === 'ref',
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

  {#if app.reference}
    <div class="refbar small">
      <label class="cmp"><input type="checkbox" bind:checked={compare} /> {t('compareOn')}</label>
      <span class="muted">{t('reference')}:</span>
      <span class="refname" title="{app.reference.name} — {app.reference.author}">{app.reference.name}</span>
      <span class="muted author">{app.reference.author ? `by ${app.reference.author}` : t('unknownAuthor')}</span>
      <button class="x" onclick={() => app.setReference(null)} title={t('closeReference')} aria-label={t('closeReference')}>✕</button>
    </div>
  {/if}

  {#snippet body()}
    {#if sample === 'code'}<CodePreview />
    {:else if sample === 'markdown'}<MarkdownPreview />
    {:else if sample === 'terminal'}<TerminalPreview />
    {:else if sample === 'tracker'}<TrackerPreview />
    {:else}<FilerPreview />{/if}
  {/snippet}

  <div class="panes" class:split={showRef}>
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
      class="pv"
      style={vars}
      data-hl={highlight ? shortName(app.selected) : null}
      onpointermove={(e) => onMove(e, 'mine')}
      onpointerleave={() => (info = null)}
      onclick={(e) => onClick(e, 'mine')}
    >
      {#if showRef}<span class="tag">{t('mine')}</span>{/if}
      {@render body()}
    </div>
    {#if showRef}
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div
        class="pv"
        style={refVars}
        data-hl={highlight ? shortName(app.selected) : null}
        onpointermove={(e) => onMove(e, 'ref')}
        onpointerleave={() => (info = null)}
        onclick={(e) => onClick(e, 'ref')}
      >
        <span class="tag">{t('reference')}</span>
        {@render body()}
      </div>
    {/if}
  </div>

  <div class="info small">
    <label class="hl" title={t('highlight')}>
      <input type="checkbox" bind:checked={highlight} />
      <span>{t('highlight')}</span>
    </label>
    {#if infoText}
      {@const pal = infoText.pal}
      {#if infoText.ref}<span class="muted">{t('reference')}</span>{/if}
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
  .refbar { display: flex; gap: 6px; align-items: center; padding: 2px 4px 4px; white-space: nowrap; overflow: hidden; flex: none; }
  .cmp { display: flex; gap: 4px; align-items: center; padding-right: 8px; border-right: 1px solid var(--ui-border); }
  .refname { font-weight: 600; overflow: hidden; text-overflow: ellipsis; }
  .refbar .author { overflow: hidden; text-overflow: ellipsis; flex: 1; }
  .x { min-height: 24px; padding: 0 8px; }
  .panes { flex: 1; min-height: 0; display: grid; gap: 4px; }
  .panes.split { grid-template-rows: 1fr 1fr; }
  @media (min-width: 960px) { .panes.split { grid-template-rows: none; grid-template-columns: 1fr 1fr; } }
  .tag { position: absolute; right: 6px; top: 4px; z-index: 1; font-size: 10px; padding: 1px 6px; border-radius: 4px; background: var(--ui-text); color: var(--ui-bg); opacity: 0.75; pointer-events: none; }
  .pv { position: relative; min-height: 0; overflow: auto; border-radius: 0 6px 6px 6px; box-shadow: inset 0 0 0 1px var(--ui-border); background: var(--base00); cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .info { display: flex; gap: 6px; align-items: center; min-height: 26px; padding: 2px 4px; white-space: nowrap; overflow: hidden; flex: none; }
  .sw { width: 14px; height: 14px; border-radius: 3px; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.4); flex: none; }
  .sp { flex: 1; }
</style>
