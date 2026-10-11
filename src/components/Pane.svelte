<script lang="ts">
  import { t, type Key } from '../lib/i18n';
  import { PANEL_KINDS, type Dir, type PanelKind } from '../lib/layout.svelte';
  import PanelContent from './PanelContent.svelte';

  interface Props {
    tabs: PanelKind[];
    active: number;
    locked: boolean;
    onselect: (index: number) => void;
    onadd: (panel: PanelKind) => void;
    onclosetab: (index: number) => void;
    /** Whether closing the only tab is allowed (it closes the pane). */
    canCloseLast?: boolean;
    /** Desktop only: split / close controls. */
    onsplit?: (dir: Dir) => void;
    onclose?: () => void;
    canSplit?: boolean;
  }
  let {
    tabs, active, locked, onselect, onadd, onclosetab, canCloseLast = false, onsplit, onclose, canSplit = true,
  }: Props = $props();

  const panel = $derived(tabs[active] ?? tabs[0]);
  const addable = $derived(PANEL_KINDS.filter((k) => !tabs.includes(k)));
  const closable = $derived(!locked && (tabs.length > 1 || canCloseLast));

  function onKey(e: KeyboardEvent, i: number) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      onselect((i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length);
    }
  }
</script>

<section class="pane">
  <header>
    <div class="tabs" role="tablist">
      {#each tabs as k, i (k)}
        <div class="tab" class:on={i === active}>
          <button
            class="label"
            role="tab"
            aria-selected={i === active}
            tabindex={i === active ? 0 : -1}
            onclick={() => onselect(i)}
            onkeydown={(e) => onKey(e, i)}
          >{t(k as Key)}</button>
          {#if closable}
            <button class="x" onclick={() => onclosetab(i)} title="{t('closeTab')}: {t(k as Key)}" aria-label="{t('closeTab')}: {t(k as Key)}">
              <svg viewBox="0 0 16 16" aria-hidden="true"><line x1="5" y1="5" x2="11" y2="11" /><line x1="11" y1="5" x2="5" y2="11" /></svg>
            </button>
          {/if}
        </div>
      {/each}
      {#if !locked && addable.length}
        <label class="add" title={t('addTab')}>
          <span aria-hidden="true">＋</span>
          <select
            aria-label={t('addTab')}
            value=""
            onchange={(e) => { const v = e.currentTarget.value; e.currentTarget.value = ''; if (v) onadd(v as PanelKind); }}
          >
            <option value="" disabled>{t('addTab')}</option>
            {#each addable as k}<option value={k}>{t(k as Key)}</option>{/each}
          </select>
        </label>
      {/if}
    </div>
    {#if !locked}
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
          <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" /><line x1="5.5" y1="5.5" x2="10.5" y2="10.5" /><line x1="10.5" y1="5.5" x2="5.5" y2="10.5" /></svg>
        </button>
      {/if}
    {/if}
  </header>
  <div class="body" class:fill={panel === 'samples'} role="tabpanel">
    <PanelContent {panel} />
  </div>
</section>

<style>
  .pane { display: flex; flex-direction: column; width: 100%; height: 100%; min-width: 0; min-height: 0; background: var(--ui-panel); }
  header { display: flex; align-items: stretch; gap: 2px; padding: 0 4px 0 0; border-bottom: 1px solid var(--ui-border); flex: none; background: var(--ui-panel-2); min-height: 32px; }
  .tabs { display: flex; flex: 1; min-width: 0; overflow-x: auto; scrollbar-width: none; align-items: stretch; }
  .tab { display: flex; align-items: center; border-right: 1px solid var(--ui-border); flex: none; }
  .tab.on { background: var(--ui-panel); box-shadow: inset 0 -2px 0 var(--ui-accent); }
  .label { border: 0; border-radius: 0; background: transparent; min-height: 30px; padding: 0 10px; font-size: 12px; color: var(--ui-muted); white-space: nowrap; }
  .tab.on .label { color: var(--ui-text); font-weight: 600; }
  .tab .x { border: 0; background: transparent; min-height: 22px; min-width: 20px; padding: 0 3px; margin-right: 3px; display: grid; place-items: center; color: var(--ui-muted); opacity: 0; }
  .tab.on .x, .tab:hover .x, .tab .x:focus-visible { opacity: 1; }
  @media (hover: none) { .tab .x { opacity: 1; } }
  .tab .x:hover { color: var(--ui-text); background: var(--ui-panel-2); }
  .add { position: relative; display: grid; place-items: center; min-width: 30px; flex: none; color: var(--ui-muted); cursor: pointer; }
  .add:hover { color: var(--ui-text); }
  /* The native select sits invisibly on top of the "+" so it opens the platform picker. */
  .add select { position: absolute; inset: 0; opacity: 0; cursor: pointer; min-height: 0; padding: 0; }
  .ic { min-height: 24px; min-width: 26px; padding: 0 4px; background: transparent; border-color: transparent; display: grid; place-items: center; align-self: center; flex: none; }
  .ic:hover:not(:disabled) { border-color: var(--ui-border); background: var(--ui-panel); }
  svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.4; }
  .x svg { width: 12px; height: 12px; }
  .body { flex: 1; min-height: 0; overflow: auto; padding: 10px 12px 14px; overscroll-behavior: contain; }
  .body.fill { overflow: hidden; padding: 6px; display: flex; flex-direction: column; }
</style>
