<script lang="ts">
  import { apcaContrast, wcagContrast } from '../../lib/color';
  import { t } from '../../lib/i18n';
  import { shortName, slotsOf, type Slot } from '../../lib/scheme';
  import { app } from '../../lib/state.svelte';

  const BG_LIKE: Slot[] = ['base00', 'base01', 'base02', 'base07', 'base10', 'base11'];
  let follow = $state(true);
  // Optionally follow the color being edited: text colors go to A, backgrounds to B.
  $effect(() => {
    const s = app.selected;
    if (!follow) return;
    if (BG_LIKE.includes(s)) app.compare.b = s;
    else app.compare.a = s;
  });

  const p = $derived(app.theme.palette);
  const slots = $derived(slotsOf(app.theme.system));
  const a = $derived(app.compare.a);
  const b = $derived(app.compare.b);
  const cmp = $derived({
    wcag: wcagContrast(p[a], p[b]),
    apcaAB: apcaContrast(p[a], p[b]),
    apcaBA: apcaContrast(p[b], p[a]),
  });
</script>

<div class="panel-body">
  <label class="small check"><input type="checkbox" bind:checked={follow} /> {t('followSelected')}</label>
  <div>
    <div class="small muted">{t('text')}</div>
    <div class="chips">
      {#each slots as s}
        <button class="c" class:sel={a === s} style:background={p[s]} title={s} aria-label={s} onclick={() => (app.compare.a = s)}></button>
      {/each}
    </div>
  </div>
  <div>
    <div class="small muted">{t('background')}</div>
    <div class="chips">
      {#each slots as s}
        <button class="c" class:sel={b === s} style:background={p[s]} title={s} aria-label={s} onclick={() => (app.compare.b = s)}></button>
      {/each}
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
    <button onclick={() => (app.compare = { a: b, b: a })}>⇅ {t('swap')}</button>
  </div>
</div>

<style>
  .chips { display: grid; grid-template-columns: repeat(auto-fill, minmax(26px, 1fr)); gap: 3px; }
  .c { min-height: 26px; padding: 0; border: 0; border-radius: 4px; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.35); }
  .c.sel { box-shadow: 0 0 0 2px var(--ui-bg), 0 0 0 4px var(--ui-accent); }
  .big { border-radius: 8px; padding: 12px 14px; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.3); }
  .big.rev { padding: 6px 14px; }
  .l1 { font-size: 28px; font-weight: 600; line-height: 1.2; }
  .l2 { font-size: 14px; }
  .nums { display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: center; }
</style>
