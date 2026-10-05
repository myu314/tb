<script lang="ts">
  import { apcaContrast, wcagContrast } from '../lib/color';
  import { evaluate, rolePairs } from '../lib/contrast';
  import { t } from '../lib/i18n';
  import { shortName, slotsOf, type Slot } from '../lib/scheme';
  import { app } from '../lib/state.svelte';
  import PairRow from './PairRow.svelte';

  type Tab = 'pairs' | 'matrix' | 'compare';
  let tab = $state<Tab>('pairs');
  let failsOnly = $state(false);
  let metric = $state<'wcag' | 'apca'>('wcag');
  let a = $state<Slot>('base05');
  let b = $state<Slot>('base00');

  const p = $derived(app.theme.palette);
  const slots = $derived(slotsOf(app.theme.system));
  const pairs = $derived(
    rolePairs(app.theme.system).filter(
      (x) => !failsOnly || (() => { const r = evaluate(p, x.fg, x.bg, x.kind); return !r.passWcag || !r.passApca; })(),
    ),
  );

  function cell(fg: Slot, bg: Slot) {
    if (metric === 'wcag') {
      const v = wcagContrast(p[fg], p[bg]);
      return { text: v.toFixed(1), cls: v >= 7 ? 'aaa' : v >= 4.5 ? 'aa' : v >= 3 ? 'large' : 'low' };
    }
    const v = Math.abs(apcaContrast(p[fg], p[bg]));
    return { text: v.toFixed(0), cls: v >= 75 ? 'aaa' : v >= 60 ? 'aa' : v >= 45 ? 'large' : 'low' };
  }

  const cmp = $derived({
    wcag: wcagContrast(p[a], p[b]),
    apcaAB: apcaContrast(p[a], p[b]),
    apcaBA: apcaContrast(p[b], p[a]),
  });
</script>

<section class="contrast">
  <div class="seg tabs" role="tablist">
    <button class:on={tab === 'pairs'} onclick={() => (tab = 'pairs')}>{t('pairs')}</button>
    <button class:on={tab === 'matrix'} onclick={() => (tab = 'matrix')}>{t('matrix')}</button>
    <button class:on={tab === 'compare'} onclick={() => (tab = 'compare')}>{t('compare')}</button>
  </div>

  {#if tab === 'pairs'}
    <label class="small check"><input type="checkbox" bind:checked={failsOnly} /> {t('failsOnly')}</label>
    <div class="head small muted"><span></span><span></span><span>WCAG</span><span>APCA</span></div>
    {#each pairs as x (x.fg + x.bg)}
      <PairRow fg={x.fg} bg={x.bg} kind={x.kind} label={x.label[app.lang]} />
    {/each}
  {:else if tab === 'matrix'}
    <div class="row-flex">
      <span class="small muted">{t('metric')}</span>
      <div class="seg">
        <button class:on={metric === 'wcag'} onclick={() => (metric = 'wcag')}>WCAG</button>
        <button class:on={metric === 'apca'} onclick={() => (metric = 'apca')}>APCA</button>
      </div>
      <span class="small muted">↓ {t('text')} / → {t('background')}</span>
    </div>
    <div class="matrix-wrap">
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
                  onclick={() => { a = fg; b = bg; tab = 'compare'; }}
                >{fg === bg ? '' : c.text}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <div class="small muted">
      <span class="lg aaa">■</span> {metric === 'wcag' ? '≥7' : '≥75'}
      <span class="lg aa">■</span> {metric === 'wcag' ? '≥4.5' : '≥60'}
      <span class="lg large">■</span> {metric === 'wcag' ? '≥3' : '≥45'}
      <span class="lg low">■</span> <span>&lt;</span>
    </div>
  {:else}
    <div class="pickers">
      <div>
        <div class="small muted">{t('text')}</div>
        <div class="chips">
          {#each slots as s}
            <button class="c" class:sel={a === s} style:background={p[s]} title={s} aria-label={s} onclick={() => (a = s)}></button>
          {/each}
        </div>
      </div>
      <div>
        <div class="small muted">{t('background')}</div>
        <div class="chips">
          {#each slots as s}
            <button class="c" class:sel={b === s} style:background={p[s]} title={s} aria-label={s} onclick={() => (b = s)}></button>
          {/each}
        </div>
      </div>
    </div>
    <div class="big" style:color={p[a]} style:background={p[b]}>
      <div class="l1">Aa あア 永</div>
      <div class="l2">The quick brown fox — 本文サンプル {shortName(a)} on {shortName(b)}</div>
    </div>
    <div class="big rev" style:color={p[b]} style:background={p[a]}>
      <div class="l2">{shortName(b)} on {shortName(a)}</div>
    </div>
    <div class="nums">
      <div><span class="muted small">WCAG</span> <strong class="mono">{cmp.wcag.toFixed(2)} : 1</strong></div>
      <div><span class="muted small">APCA {shortName(a)}/{shortName(b)}</span> <strong class="mono">Lc {cmp.apcaAB.toFixed(1)}</strong></div>
      <div><span class="muted small">APCA {shortName(b)}/{shortName(a)}</span> <strong class="mono">Lc {cmp.apcaBA.toFixed(1)}</strong></div>
      <button onclick={() => { const x = a; a = b; b = x; }}>⇅ {t('swap')}</button>
    </div>
  {/if}
  <p class="legend small muted">{t('legend')}</p>
</section>

<style>
  .contrast { display: flex; flex-direction: column; gap: 8px; }
  .tabs { align-self: flex-start; }
  .check { display: flex; gap: 6px; align-items: center; }
  .head { display: grid; grid-template-columns: 40px 1fr 72px 72px; gap: 8px; text-align: right; }
  .row-flex { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .matrix-wrap { overflow: auto; max-height: 60vh; border: 1px solid var(--ui-border); border-radius: 6px; }
  .matrix { border-collapse: collapse; font-size: 10px; }
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
  .pickers { display: flex; flex-direction: column; gap: 6px; }
  .chips { display: grid; grid-template-columns: repeat(auto-fill, minmax(26px, 1fr)); gap: 3px; }
  .c { min-height: 26px; padding: 0; border: 0; border-radius: 4px; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.35); }
  .c.sel { box-shadow: 0 0 0 2px var(--ui-bg), 0 0 0 4px var(--ui-accent); }
  .big { border-radius: 8px; padding: 12px 14px; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.3); }
  .big.rev { padding: 6px 14px; }
  .l1 { font-size: 28px; font-weight: 600; line-height: 1.2; }
  .l2 { font-size: 14px; }
  .nums { display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: center; }
  .legend { margin: 4px 0 0; }
</style>
