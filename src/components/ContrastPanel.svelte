<script lang="ts">
  import { apcaContrast, wcagContrast } from '../lib/color';
  import { distinctPairs, distinctSlots, evaluate, rolePairs } from '../lib/contrast';
  import { hexToOklch } from '../lib/color';
  import { t } from '../lib/i18n';
  import { shortName, slotsOf, type Slot } from '../lib/scheme';
  import { app } from '../lib/state.svelte';
  import PairRow from './PairRow.svelte';

  type Tab = 'pairs' | 'matrix' | 'compare' | 'distinct';
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

  let closeOnly = $state(true);
  const dPairs = $derived(distinctPairs(p, app.theme.system));
  const dShown = $derived(closeOnly ? dPairs.filter((x) => x.level !== 'ok') : dPairs);
  // Polar plot: angle = OKLCH hue, radius = chroma.
  const R = 80;
  const dots = $derived.by(() => {
    const lchs = distinctSlots(app.theme.system).map((s) => ({ s, c: hexToOklch(p[s]) }));
    // Scale to the most saturated accent so low-chroma themes don't bunch up in the middle.
    const cmax = Math.max(0.08, ...lchs.map((x) => x.c.c)) * 1.1;
    return lchs.map(({ s, c }) => {
      const r = (c.c / cmax) * R;
      const a = (c.h * Math.PI) / 180;
      return { s, x: r * Math.cos(a), y: -r * Math.sin(a) };
    });
  });

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
    <button class:on={tab === 'distinct'} onclick={() => (tab = 'distinct')}>{t('distinct')}</button>
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
  {:else if tab === 'distinct'}
    <p class="small muted desc">{t('distinctDesc')}</p>
    <div class="map">
      <svg viewBox="-100 -100 200 200" role="img" aria-label={t('hueMap')}>
        <circle r={R} class="ring" />
        <circle r={R / 2} class="ring" />
        <line x1={-R} x2={R} class="ring" />
        <line y1={-R} y2={R} class="ring" />
        {#each dots as d (d.s)}
          <g role="button" tabindex="-1" onclick={() => (app.selected = d.s)} onkeydown={() => {}} class="dot">
            <circle cx={d.x} cy={d.y} r={app.selected === d.s ? 9 : 7} fill={p[d.s]} />
            <text x={d.x} y={d.y - 11} text-anchor="middle">{shortName(d.s)}</text>
          </g>
        {/each}
      </svg>
      <div class="small muted">{t('hueMap')}</div>
    </div>
    <label class="small check"><input type="checkbox" bind:checked={closeOnly} /> {t('problemsOnly')}</label>
    {#if dShown.length === 0}
      <p class="small ok-msg">✓ {t('noIssues')}</p>
    {/if}
    {#each dShown as x (x.a + x.b)}
      <div class="dpair">
        <div class="duo"><span style:background={p[x.a]}></span><span style:background={p[x.b]}></span></div>
        <div class="ontext mono" style:background={p.base00}><span style:color={p[x.a]}>Aa</span><span style:color={p[x.b]}>Aa</span></div>
        <div class="mono small">
          <button class="link" onclick={() => (app.selected = x.a)}>{shortName(x.a)}</button>
          <span class="muted">/</span>
          <button class="link" onclick={() => (app.selected = x.b)}>{shortName(x.b)}</button>
        </div>
        <div class="metric mono small">
          ΔE {x.de.toFixed(1)}
          <span class="badge {x.level === 'ok' ? 'ok' : x.level}">{x.level === 'ok' ? 'OK' : x.level === 'warn' ? '△' : 'NG'}</span>
        </div>
        <div class="muted mono small">Δh {x.dh.toFixed(0)}°</div>
      </div>
    {/each}
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
  .tabs { align-self: flex-start; max-width: 100%; overflow-x: auto; }
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
  .desc { margin: 0; }
  .map { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .map svg { width: 100%; max-width: 240px; overflow: visible; }
  .ring { fill: none; stroke: var(--ui-border); stroke-width: 1; }
  .dot { cursor: pointer; }
  .dot circle { stroke: var(--ui-text); stroke-width: 1; }
  .dot text { font: 9px var(--mono); fill: var(--ui-muted); }
  .ok-msg { color: var(--ui-ok); margin: 0; }
  .dpair { display: grid; grid-template-columns: 44px 56px 1fr auto 3.5em; gap: 8px; align-items: center; padding: 3px 0; }
  .duo { display: flex; height: 28px; border-radius: 6px; overflow: hidden; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.3); }
  .duo span { flex: 1; }
  .ontext { display: flex; justify-content: space-around; border-radius: 6px; height: 28px; align-items: center; font-weight: 600; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.3); }
  .dpair .metric { display: flex; gap: 4px; align-items: center; }
  .link { all: unset; cursor: pointer; text-decoration: underline dotted; }
</style>
