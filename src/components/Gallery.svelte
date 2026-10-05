<script lang="ts">
  import './previews/preview.css';
  import { t, type Key } from '../lib/i18n';
  import { entryTheme, loadSchemes, themeFromEntry, type SchemeData, type SchemeEntry } from '../lib/presets';
  import { previewVars } from '../lib/preview';
  import { app } from '../lib/state.svelte';
  import Modal from './Modal.svelte';
  import CodePreview from './previews/CodePreview.svelte';
  import FilerPreview from './previews/FilerPreview.svelte';
  import MarkdownPreview from './previews/MarkdownPreview.svelte';
  import TerminalPreview from './previews/TerminalPreview.svelte';
  import TrackerPreview from './previews/TrackerPreview.svelte';

  interface Props { onclose: () => void; }
  let { onclose }: Props = $props();

  let data = $state<SchemeData | null>(null);
  let error = $state('');
  loadSchemes().then((d) => (data = d), (e) => (error = String(e)));

  let query = $state('');
  let variant = $state<'all' | 'dark' | 'light'>('all');
  let system = $state<'all' | 'base16' | 'base24'>('all');
  let picked = $state<SchemeEntry | null>(null);
  type Sample = 'code' | 'markdown' | 'terminal' | 'tracker' | 'filer';
  let sample = $state<Sample>('code');

  const sorted = $derived(
    data ? [...data.schemes].sort((a, b) => a.name.localeCompare(b.name) || a.system.localeCompare(b.system)) : [],
  );
  const shown = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter(
      (e) =>
        (variant === 'all' || e.variant === variant) &&
        (system === 'all' || e.system === system) &&
        (!q || e.name.toLowerCase().includes(q) || e.author.toLowerCase().includes(q) || e.slug.includes(q)),
    );
  });

  /** Hard-stop gradient: one band per color. */
  function band(colors: string, from: number, to: number) {
    const n = to - from;
    const stops = [];
    for (let i = 0; i < n; i++) {
      const c = '#' + colors.slice((from + i) * 6, (from + i) * 6 + 6);
      stops.push(`${c} ${(i / n) * 100}% ${((i + 1) / n) * 100}%`);
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }

  const pickedTheme = $derived(picked ? entryTheme(picked) : null);
  const sourceUrl = $derived(
    picked && data ? `${data.source}/blob/${data.commit}/${picked.system}/${picked.slug}.yaml` : '',
  );

  function useAsBase() {
    if (!picked) return;
    app.addTheme(themeFromEntry(picked));
    onclose();
  }
  function useAsReference() {
    if (!pickedTheme) return;
    app.setReference(pickedTheme);
    onclose();
  }
</script>

<Modal title={t('gallery')} {onclose} wide>
  <div class="gallery">
    <div class="filters">
      <input type="search" placeholder={t('search')} bind:value={query} aria-label={t('search')} />
      <div class="seg">
        <button class:on={variant === 'all'} onclick={() => (variant = 'all')}>{t('all')}</button>
        <button class:on={variant === 'dark'} onclick={() => (variant = 'dark')}>{t('dark')}</button>
        <button class:on={variant === 'light'} onclick={() => (variant = 'light')}>{t('light')}</button>
      </div>
      <div class="seg">
        <button class:on={system === 'all'} onclick={() => (system = 'all')}>{t('all')}</button>
        <button class:on={system === 'base16'} onclick={() => (system = 'base16')}>16</button>
        <button class:on={system === 'base24'} onclick={() => (system = 'base24')}>24</button>
      </div>
      <span class="small muted">{data ? `${shown.length} ${t('items')}` : t('loading')}</span>
    </div>

    <div class="detail">
      {#if picked && pickedTheme}
        <div class="meta">
          <div class="title">
            <strong>{picked.name}</strong>
            <span class="badge">{picked.system}</span>
            <span class="badge">{t(picked.variant as Key)}</span>
          </div>
          <div class="small muted author">{picked.author ? `by ${picked.author}` : t('unknownAuthor')}</div>
          {#if picked.description}<div class="small muted author">{picked.description}</div>{/if}
          <div class="btns">
            <button class="primary" onclick={useAsBase}>{t('useAsBase')}</button>
            <button onclick={useAsReference}>{t('useAsReference')}</button>
            <a class="small" href={sourceUrl} target="_blank" rel="noopener">{t('viewSource')} ↗</a>
          </div>
        </div>
        <div class="stabs">
          {#each ['code', 'markdown', 'terminal', 'tracker', 'filer'] as const as s}
            <button class:on={sample === s} onclick={() => (sample = s)}>{t(s)}</button>
          {/each}
        </div>
        <div class="pv" style={previewVars(pickedTheme)}>
          {#if sample === 'code'}<CodePreview />
          {:else if sample === 'markdown'}<MarkdownPreview />
          {:else if sample === 'terminal'}<TerminalPreview />
          {:else if sample === 'tracker'}<TrackerPreview />
          {:else}<FilerPreview />{/if}
        </div>
      {:else}
        <p class="muted small empty">{error || t('pickScheme')}</p>
      {/if}
    </div>

    <ul class="list">
      {#each shown as e (e.system + e.slug)}
        <li>
          <button class="card" class:sel={picked === e} onclick={() => (picked = e)}>
            <span class="strip" style:background={band(e.colors, 0, 8)}></span>
            <span class="strip" style:background={band(e.colors, 8, e.system === 'base24' ? 24 : 16)}></span>
            <span class="name">{e.name}{#if e.system === 'base24'}<span class="tag">24</span>{/if}</span>
            <span class="author small muted">{e.author || t('unknownAuthor')}</span>
          </button>
        </li>
      {/each}
    </ul>
  </div>
</Modal>

<style>
  .gallery {
    display: grid;
    grid-template-columns: minmax(280px, 1fr) minmax(0, 1.4fr);
    grid-template-rows: auto 1fr;
    grid-template-areas: 'filters filters' 'list detail';
    height: 100%;
    min-height: 0;
  }
  .filters { grid-area: filters; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 10px 12px; border-bottom: 1px solid var(--ui-border); }
  .filters input { flex: 1 1 180px; }
  .list { grid-area: list; list-style: none; margin: 0; padding: 8px; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; align-content: start; }
  .card { width: 100%; display: flex; flex-direction: column; gap: 3px; text-align: left; padding: 6px; background: var(--ui-panel); border-radius: 8px; }
  .card.sel { border-color: var(--ui-accent); box-shadow: 0 0 0 1px var(--ui-accent); }
  .strip { height: 14px; border-radius: 3px; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.25); }
  .name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tag { font-size: 10px; margin-left: 6px; padding: 0 4px; border-radius: 3px; background: var(--ui-panel-2); color: var(--ui-muted); font-weight: 500; }
  .author { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .detail { grid-area: detail; display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; border-left: 1px solid var(--ui-border); min-height: 0; }
  .meta { display: flex; flex-direction: column; gap: 2px; }
  .title { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .badge { background: var(--ui-panel-2); color: var(--ui-muted); font-weight: 500; }
  .meta .author { white-space: normal; }
  .btns { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 6px; }
  .btns a { color: var(--ui-muted); }
  .stabs { display: flex; gap: 2px; overflow-x: auto; scrollbar-width: none; }
  .stabs button { border: 0; background: transparent; color: var(--ui-muted); white-space: nowrap; padding: 2px 8px; min-height: 28px; }
  .stabs button.on { background: var(--ui-panel-2); color: var(--ui-text); font-weight: 600; }
  .pv { flex: 1; min-height: 0; overflow: auto; border-radius: 6px; box-shadow: inset 0 0 0 1px var(--ui-border); background: var(--base00); }
  .empty { margin: auto; }

  @media (max-width: 760px) {
    .gallery { grid-template-columns: 1fr; grid-template-rows: auto auto 1fr; grid-template-areas: 'filters' 'detail' 'list'; }
    .detail { border-left: 0; border-bottom: 1px solid var(--ui-border); }
    .detail:has(.pv) .pv { height: 30dvh; flex: none; }
    .filters input { flex-basis: 100%; }
    .list { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
  }
</style>
