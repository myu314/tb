<script lang="ts">
  import { t } from '../lib/i18n';
  import { ACCENT_SLOTS, BASE24_EXTRA, GRAY_SLOTS, ROLES, shortName, type Slot } from '../lib/scheme';
  import { app } from '../lib/state.svelte';

  interface Props { compact?: boolean; onpick?: (s: Slot) => void; }
  let { compact = false, onpick }: Props = $props();

  const groups = $derived([
    { title: t('grays'), slots: GRAY_SLOTS },
    { title: t('accents'), slots: ACCENT_SLOTS },
    ...(app.theme.system === 'base24' ? [{ title: t('base24extra'), slots: [...BASE24_EXTRA] as Slot[] }] : []),
  ]);

  function pick(s: Slot) {
    app.selected = s;
    onpick?.(s);
  }
</script>

{#if compact}
  <div class="strip" role="listbox" aria-label={t('palette')}>
    {#each groups as g}
      {#each g.slots as s}
        <button
          class="chip"
          class:sel={app.selected === s}
          style:background={app.theme.palette[s]}
          role="option"
          aria-selected={app.selected === s}
          title="{s} {ROLES[s].label[app.lang]}"
          onclick={() => pick(s)}
        >
          <span class="mono">{shortName(s)}</span>
        </button>
      {/each}
    {/each}
  </div>
{:else}
  <div class="list">
    {#each groups as g}
      <h3>{g.title}</h3>
      {#each g.slots as s}
        <button class="row" class:sel={app.selected === s} onclick={() => pick(s)}>
          <span class="sw" style:background={app.theme.palette[s]}></span>
          <span class="info">
            <span class="top">
              <strong class="mono">{shortName(s)}</strong>
              <span>{ROLES[s].label[app.lang]}</span>
              <span class="hex mono muted">{app.theme.palette[s]}</span>
            </span>
            <span class="uses muted small">{ROLES[s].uses[app.lang]}</span>
          </span>
        </button>
      {/each}
    {/each}
  </div>
{/if}

<style>
  h3 { font-size: 12px; font-weight: 600; color: var(--ui-muted); margin: 12px 0 4px; }
  h3:first-child { margin-top: 0; }
  .row {
    display: flex;
    gap: 10px;
    align-items: center;
    width: 100%;
    text-align: left;
    background: transparent;
    border: 1px solid transparent;
    padding: 4px 6px;
    border-radius: 6px;
  }
  .row:hover { background: var(--ui-panel-2); }
  .row.sel { border-color: var(--ui-accent); background: var(--ui-panel-2); }
  .sw { width: 34px; height: 34px; border-radius: 6px; flex: none; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.35); }
  .info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
  .top { display: flex; gap: 8px; align-items: baseline; }
  .hex { margin-left: auto; font-size: 12px; }
  .uses { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3; }

  .strip { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; }
  .chip {
    min-height: 30px;
    padding: 0;
    border-radius: 5px;
    border: 0;
    box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.35);
    display: grid;
    place-items: end start;
  }
  .chip span {
    font-size: 9px;
    line-height: 1;
    padding: 2px 3px;
    margin: 2px;
    border-radius: 3px;
    background: rgb(0 0 0 / 0.55);
    color: #fff;
  }
  .chip.sel { box-shadow: 0 0 0 2px var(--ui-bg), 0 0 0 4px var(--ui-accent); }
</style>
