<script lang="ts">
  import { apcaContrast, wcagContrast } from '../../lib/color';
  import { t } from '../../lib/i18n';
  import { shortName, slotsOf, type Slot } from '../../lib/scheme';
  import { app } from '../../lib/state.svelte';

  let metric = $state<'wcag' | 'apca'>('wcag');
  const p = $derived(app.theme.palette);
  const slots = $derived(slotsOf(app.theme.system));

  function cell(fg: Slot, bg: Slot) {
    if (metric === 'wcag') {
      const v = wcagContrast(p[fg], p[bg]);
      return { text: v.toFixed(1), cls: v >= 7 ? 'aaa' : v >= 4.5 ? 'aa' : v >= 3 ? 'large' : 'low' };
    }
    const v = Math.abs(apcaContrast(p[fg], p[bg]));
    return { text: v.toFixed(0), cls: v >= 75 ? 'aaa' : v >= 60 ? 'aa' : v >= 45 ? 'large' : 'low' };
  }
</script>

<div class="panel-body">
  <div class="row-flex">
    <div class="seg">
      <button class:on={metric === 'wcag'} onclick={() => (metric = 'wcag')}>WCAG</button>
      <button class:on={metric === 'apca'} onclick={() => (metric = 'apca')}>APCA</button>
    </div>
    <span class="small muted">↓ {t('text')} / → {t('background')}</span>
  </div>
  <!-- The panel itself scrolls in both directions, so the table is never clipped. -->
  <table class="matrix mono">
    <thead>
      <tr>
        <th></th>
        {#each slots as bg}
          <th><button class="hdr" style:background={p[bg]} onclick={() => (app.selected = bg)} title={bg}></button>{shortName(bg)}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each slots as fg}
        <tr>
          <th><button class="hdr" style:background={p[fg]} onclick={() => (app.selected = fg)} title={fg}></button>{shortName(fg)}</th>
          {#each slots as bg}
            {@const c = cell(fg, bg)}
            <td
              class={c.cls}
              style:color={p[fg]}
              style:background={p[bg]}
              title="{fg} on {bg}"
              onclick={() => (app.compare = { a: fg, b: bg })}
            >{fg === bg ? '' : c.text}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  <div class="small muted">
    <span class="lg aaa">■</span> {metric === 'wcag' ? '≥7' : '≥75'}
    <span class="lg aa">■</span> {metric === 'wcag' ? '≥4.5' : '≥60'}
    <span class="lg large">■</span> {metric === 'wcag' ? '≥3' : '≥45'}
    <span class="lg low">■</span> <span>&lt;</span>
    · {t('matrixHint')}
  </div>
</div>

<style>
  .matrix { border-collapse: collapse; font-size: 10px; align-self: flex-start; }
  .matrix th { position: sticky; background: var(--ui-panel); font-weight: 600; padding: 2px; color: var(--ui-muted); z-index: 1; }
  .matrix thead th { top: 0; }
  .matrix tbody th { left: 0; text-align: left; white-space: nowrap; }
  .matrix thead th:first-child { left: 0; z-index: 2; }
  .hdr { all: unset; display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 2px; vertical-align: -1px; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.4); cursor: pointer; }
  .matrix td { width: 30px; min-width: 30px; height: 24px; text-align: center; cursor: pointer; position: relative; }
  .matrix td.low { opacity: 0.55; }
  .matrix td::after { content: ''; position: absolute; left: 2px; right: 2px; bottom: 1px; height: 2px; border-radius: 1px; }
  .matrix td.aaa::after, .lg.aaa { background: var(--ui-ok); color: var(--ui-ok); }
  .matrix td.aa::after, .lg.aa { background: color-mix(in srgb, var(--ui-ok) 55%, var(--ui-warn)); color: color-mix(in srgb, var(--ui-ok) 55%, var(--ui-warn)); }
  .matrix td.large::after, .lg.large { background: var(--ui-warn); color: var(--ui-warn); }
  .lg { background: none !important; }
  .lg.low { color: var(--ui-bad); }
</style>
