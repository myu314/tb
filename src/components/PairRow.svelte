<script lang="ts">
  import { evaluate, type PairKind } from '../lib/contrast';
  import { shortName, type Slot } from '../lib/scheme';
  import { app } from '../lib/state.svelte';

  interface Props { fg: Slot; bg: Slot; kind: PairKind; label?: string; }
  let { fg, bg, kind, label }: Props = $props();

  const p = $derived(app.theme.palette);
  const r = $derived(evaluate(p, fg, bg, kind));
</script>

<div class="pair">
  <div class="sample" style:color={p[fg]} style:background={p[bg]}>Aa</div>
  <div class="who">
    <div class="mono small">
      <button class="link" onclick={() => (app.selected = fg)}>{shortName(fg)}</button>
      <span class="muted">/</span>
      <button class="link" onclick={() => (app.selected = bg)}>{shortName(bg)}</button>
    </div>
    {#if label}<div class="muted small ellipsis">{label}</div>{/if}
  </div>
  <div class="metric">
    <span class="mono">{r.wcag.toFixed(2)}</span>
    <span class="badge {r.passWcag ? 'ok' : 'bad'}">{r.passWcag ? (r.wcag >= 7 ? 'AAA' : 'AA') : 'NG'}</span>
  </div>
  <div class="metric">
    <span class="mono">Lc {Math.abs(r.apca).toFixed(0)}</span>
    <span class="badge {r.passApca ? 'ok' : 'bad'}">{r.passApca ? 'OK' : 'NG'}</span>
  </div>
</div>

<style>
  .pair {
    display: grid;
    grid-template-columns: 40px 1fr auto auto;
    gap: 8px;
    align-items: center;
    padding: 4px 0;
  }
  .sample {
    height: 32px;
    border-radius: 6px;
    display: grid;
    place-items: center;
    font-weight: 600;
    box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.3);
  }
  .who { min-width: 0; }
  .ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .metric { display: flex; gap: 4px; align-items: center; justify-content: flex-end; font-size: 12px; min-width: 72px; }
  .link { all: unset; cursor: pointer; text-decoration: underline dotted; }
</style>
