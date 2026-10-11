<script lang="ts">
  import { fixContrast, type ContrastMetric } from '../../lib/adjust';
  import { evaluate, rolePairs } from '../../lib/contrast';
  import { t } from '../../lib/i18n';
  import { shortName } from '../../lib/scheme';
  import { app } from '../../lib/state.svelte';
  import PairRow from '../PairRow.svelte';

  let failsOnly = $state(false);
  let relatedOnly = $state(true);
  let fixMetric = $state<ContrastMetric>('both');
  let message = $state('');

  const p = $derived(app.theme.palette);
  const pairs = $derived(
    rolePairs(app.theme.system).filter(
      (x) =>
        (!relatedOnly || x.fg === app.selected || x.bg === app.selected) &&
        (!failsOnly || (() => { const r = evaluate(p, x.fg, x.bg, x.kind); return !r.passWcag || !r.passApca; })()),
    ),
  );

  function fixFailing() {
    const r = fixContrast(p, app.theme.system, fixMetric);
    const n = Object.keys(r.colors).length;
    if (n) app.setColors(r.colors);
    const parts = [n ? `${n} ${t('adjustedN')}` : t('nothingToFix')];
    if (r.unfixable.length) parts.push(`${r.unfixable.map(shortName).join(', ')}: ${t('unfixableN')}`);
    message = parts.join(' / ');
    const shown = message;
    setTimeout(() => { if (message === shown) message = ''; }, 4000);
  }
</script>

<div class="panel-body">
  <div class="row-flex">
    <label class="small check"><input type="checkbox" bind:checked={relatedOnly} /> {t('relatedOnly')}</label>
    <label class="small check"><input type="checkbox" bind:checked={failsOnly} /> {t('failsOnly')}</label>
  </div>
  {#if pairs.length === 0}
    <p class="small muted">{relatedOnly ? t('noRelatedPairs') : t('nothingToFix')}</p>
  {:else}
    <div class="head small muted"><span></span><span></span><span>WCAG</span><span>APCA</span></div>
    {#each pairs as x (x.fg + x.bg)}
      <PairRow fg={x.fg} bg={x.bg} kind={x.kind} label={x.label[app.lang]} />
    {/each}
  {/if}
  <div class="row-flex fix">
    <span class="small muted">{t('fixTarget')}</span>
    <div class="seg">
      <button class:on={fixMetric === 'wcag'} onclick={() => (fixMetric = 'wcag')}>WCAG</button>
      <button class:on={fixMetric === 'apca'} onclick={() => (fixMetric = 'apca')}>APCA</button>
      <button class:on={fixMetric === 'both'} onclick={() => (fixMetric = 'both')}>{t('both')}</button>
    </div>
    <button class="primary" onclick={fixFailing}>{t('fixFailing')}</button>
  </div>
  {#if message}<p class="small msg" role="status">{message}</p>{/if}
  <p class="small muted legend">{t('legend')}</p>
</div>

<style>
  .head { display: grid; grid-template-columns: 40px 1fr 72px 72px; gap: 8px; text-align: right; }
  .fix { padding-top: 8px; border-top: 1px solid var(--ui-border); }
  .legend { margin: 0; }
</style>
