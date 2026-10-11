<script lang="ts">
  import { t, type Key } from '../lib/i18n';
  import { PANEL_KINDS, type Dir, type PanelKind } from '../lib/layout.svelte';
  import PanelContent from './PanelContent.svelte';

  interface Props {
    panel: PanelKind;
    onchange: (panel: PanelKind) => void;
    /** Desktop only: split / close controls. */
    onsplit?: (dir: Dir) => void;
    onclose?: () => void;
    canSplit?: boolean;
  }
  let { panel, onchange, onsplit, onclose, canSplit = true }: Props = $props();
</script>

<section class="pane">
  <header>
    <select value={panel} onchange={(e) => onchange(e.currentTarget.value as PanelKind)} aria-label={t('choosePanel')}>
      {#each PANEL_KINDS as k}<option value={k}>{t(k as Key)}</option>{/each}
    </select>
    <span class="sp"></span>
    {#if onsplit}
      <button class="ic" disabled={!canSplit} onclick={() => onsplit('row')} title={t('splitRight')} aria-label={t('splitRight')}>
        <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" /><line x1="8" y1="2.5" x2="8" y2="13.5" /></svg>
      </button>
      <button class="ic" disabled={!canSplit} onclick={() => onsplit('col')} title={t('splitDown')} aria-label={t('splitDown')}>
        <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" /><line x1="1.5" y1="8" x2="14.5" y2="8" /></svg>
      </button>
    {/if}
    {#if onclose}
      <button class="ic" onclick={onclose} title={t('closePane')} aria-label={t('closePane')}>
        <svg viewBox="0 0 16 16" aria-hidden="true"><line x1="4" y1="4" x2="12" y2="12" /><line x1="12" y1="4" x2="4" y2="12" /></svg>
      </button>
    {/if}
  </header>
  <div class="body" class:fill={panel === 'samples'}>
    <PanelContent {panel} />
  </div>
</section>

<style>
  .pane { display: flex; flex-direction: column; width: 100%; height: 100%; min-width: 0; min-height: 0; background: var(--ui-panel); }
  header { display: flex; align-items: center; gap: 2px; padding: 3px 4px 3px 6px; border-bottom: 1px solid var(--ui-border); flex: none; background: var(--ui-panel-2); }
  select { min-height: 26px; padding: 0 6px; font-size: 12px; font-weight: 600; border-color: transparent; background: transparent; }
  select:hover { border-color: var(--ui-border); }
  .sp { flex: 1; }
  .ic { min-height: 24px; min-width: 26px; padding: 0 4px; background: transparent; border-color: transparent; display: grid; place-items: center; }
  .ic:hover:not(:disabled) { border-color: var(--ui-border); background: var(--ui-panel); }
  .ic svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.4; }
  .body { flex: 1; min-height: 0; overflow: auto; padding: 10px 12px 14px; overscroll-behavior: contain; }
  .body.fill { overflow: hidden; padding: 6px; display: flex; flex-direction: column; }
</style>
