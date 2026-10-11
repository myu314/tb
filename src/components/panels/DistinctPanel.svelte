<script lang="ts">
  import { separateAccents } from '../../lib/adjust';
  import { clamp, hexToOklch, oklchToHex } from '../../lib/color';
  import { distinctPairs, distinctSlots } from '../../lib/contrast';
  import { t } from '../../lib/i18n';
  import { shortName, type Slot } from '../../lib/scheme';
  import { app } from '../../lib/state.svelte';

  const p = $derived(app.theme.palette);
  let closeOnly = $state(true);
  const dPairs = $derived(distinctPairs(p, app.theme.system));
  const dShown = $derived(closeOnly ? dPairs.filter((x) => x.level !== 'ok') : dPairs);
  // Polar plot: angle = OKLCH hue, radius = chroma.
  const R = 80;
  const lchs = $derived(distinctSlots(app.theme.system).map((s) => ({ s, c: hexToOklch(p[s]) })));
  // Scale to the most saturated accent so low-chroma themes don't bunch up in the middle.
  // The scale is frozen while dragging so the plot doesn't shift under the pointer.
  const autoScale = $derived(Math.max(0.08, ...lchs.map((x) => x.c.c)) * 1.1);
  let frozenScale = $state<number | null>(null);
  const scale = $derived(frozenScale ?? autoScale);
  const dots = $derived(
    lchs.map(({ s, c }) => {
      const r = (c.c / scale) * R;
      const a = (c.h * Math.PI) / 180;
      return { s, x: r * Math.cos(a), y: -r * Math.sin(a) };
    }),
  );
  const pos = $derived(Object.fromEntries(dots.map((d) => [d.s, d])));
  const links = $derived(dPairs.filter((x) => x.level !== 'ok'));

  let svgEl = $state<SVGSVGElement>();
  let drag: { slot: Slot; l: number } | null = null;

  function dotDown(e: PointerEvent, s: Slot) {
    app.selected = s;
    drag = { slot: s, l: hexToOklch(p[s]).l };
    frozenScale = autoScale;
    svgEl!.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function dragMove(e: PointerEvent) {
    if (!drag || !svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 200 - 100;
    const y = ((e.clientY - rect.top) / rect.height) * 200 - 100;
    const r = Math.min(Math.hypot(x, y), R);
    const h = ((Math.atan2(-y, x) * 180) / Math.PI + 360) % 360;
    const hex = oklchToHex({ l: drag.l, c: (r / R) * scale, h });
    app.setColors({ [drag.slot]: hex }, { transient: true });
  }
  function dragEnd() {
    if (!drag) return;
    drag = null;
    frozenScale = null;
    app.commit();
  }
  function dotKey(e: KeyboardEvent, s: Slot) {
    const c = hexToOklch(p[s]);
    const big = e.shiftKey;
    let next = { ...c };
    if (e.key === 'ArrowLeft') next.h = (c.h + (big ? 10 : 2)) % 360;
    else if (e.key === 'ArrowRight') next.h = (c.h - (big ? 10 : 2) + 360) % 360;
    else if (e.key === 'ArrowUp') next.c = clamp(c.c + (big ? 0.02 : 0.005), 0, 0.4);
    else if (e.key === 'ArrowDown') next.c = clamp(c.c - (big ? 0.02 : 0.005), 0, 0.4);
    else return;
    e.preventDefault();
    app.selected = s;
    app.setColors({ [s]: oklchToHex(next) });
  }

  let message = $state('');
  function applySeparation(only?: [Slot, Slot]) {
    const r = separateAccents(p, app.theme.system, only ? { only } : {});
    const n = Object.keys(r.colors).length;
    if (n) app.setColors(r.colors);
    const parts = [n ? `${n} ${t('adjustedN')}` : t('nothingToFix')];
    if (r.remaining) parts.push(`${r.remaining} ${t('remainingN')}`);
    message = parts.join(' / ');
    const shown = message;
    setTimeout(() => { if (message === shown) message = ''; }, 4000);
  }
</script>

<div class="panel-body">
    <p class="small muted desc">{t('distinctDesc')}</p>
    <div class="map">
      <svg
        bind:this={svgEl}
        viewBox="-100 -100 200 200"
        role="group"
        aria-label={t('hueMap')}
        onpointermove={dragMove}
        onpointerup={dragEnd}
        onpointercancel={dragEnd}
      >
        <circle r={R} class="ring" />
        <circle r={R / 2} class="ring" />
        <line x1={-R} x2={R} class="ring" />
        <line y1={-R} y2={R} class="ring" />
        <text x={R - 2} y={-3} class="scale" text-anchor="end">C {scale.toFixed(2)}</text>
        {#each links as l (l.a + l.b)}
          {#if pos[l.a] && pos[l.b]}
            <line x1={pos[l.a].x} y1={pos[l.a].y} x2={pos[l.b].x} y2={pos[l.b].y} class="link-{l.level}" />
          {/if}
        {/each}
        {#each dots as d (d.s)}
          <g
            role="slider"
            tabindex="0"
            aria-label="{d.s} hue / chroma"
            aria-valuenow={Math.round(hexToOklch(p[d.s]).h)}
            class="dot"
            class:sel={app.selected === d.s}
            onpointerdown={(e) => dotDown(e, d.s)}
            onkeydown={(e) => dotKey(e, d.s)}
          >
            <circle cx={d.x} cy={d.y} r="14" class="hit" />
            <circle cx={d.x} cy={d.y} r={app.selected === d.s ? 9 : 7} fill={p[d.s]} />
            <text x={d.x} y={d.y - 11} text-anchor="middle">{shortName(d.s)}</text>
          </g>
        {/each}
      </svg>
      <div class="small muted">{t('hueMap')}</div>
      <p class="small muted hint">{t('dragHint')}</p>
    </div>
    <div class="row-flex">
      <button class="primary" disabled={!links.length} onclick={() => applySeparation()}>{t('separateAll')}</button>
    </div>
    {#if message}<p class="small msg" role="status">{message}</p>{/if}
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
        {#if x.level !== 'ok'}
          <button class="sep" onclick={() => applySeparation([x.a, x.b])}>{t('separateOne')}</button>
        {:else}<span></span>{/if}
      </div>
    {/each}
</div>

<style>
  .map { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .map svg { width: 100%; max-width: 240px; overflow: visible; }
  .ring { fill: none; stroke: var(--ui-border); stroke-width: 1; }
  .dot { cursor: grab; touch-action: none; outline: none; }
  .dot .hit { fill: transparent; stroke: none; }
  .dot.sel circle:not(.hit) { stroke-width: 2; }
  .dot:focus-visible .hit { stroke: var(--ui-focus); stroke-width: 1.5; }
  .map svg { touch-action: none; }
  .scale { font: 8px var(--mono); fill: var(--ui-muted); }
  .link-bad { stroke: var(--ui-bad); stroke-width: 2; }
  .link-warn { stroke: var(--ui-warn); stroke-width: 1.5; stroke-dasharray: 4 3; }
  .hint { margin: 0; text-align: center; }
  .sep { min-height: 26px; padding: 0 8px; font-size: 12px; }
  .dot circle { stroke: var(--ui-text); stroke-width: 1; }
  .dot text { font: 9px var(--mono); fill: var(--ui-muted); }
  .ok-msg { color: var(--ui-ok); margin: 0; }
  .dpair { display: grid; grid-template-columns: 44px 56px 1fr auto 3.2em auto; gap: 8px; align-items: center; padding: 3px 0; }
  .duo { display: flex; height: 28px; border-radius: 6px; overflow: hidden; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.3); }
  .duo span { flex: 1; }
  .ontext { display: flex; justify-content: space-around; border-radius: 6px; height: 28px; align-items: center; font-weight: 600; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.3); }
  .dpair .metric { display: flex; gap: 4px; align-items: center; }
</style>
