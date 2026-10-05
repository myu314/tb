<script lang="ts">
  import { t } from '../lib/i18n';
  import {
    ACCENT_SLOTS,
    BRIGHT_SLOTS,
    GRAY_SLOTS,
    accentStats,
    grayRamp,
    invertVariant,
    newId,
    normalizeAccents,
    type Palette,
    type Slot,
  } from '../lib/scheme';
  import { app } from '../lib/state.svelte';

  const p = $derived(app.theme.palette);

  // gray ramp
  let easing = $state(1);
  const ramp = $derived({ ...p, ...grayRamp(p, easing) } as Palette);

  // accent adjust
  let target = $state<'accents' | 'brights'>('accents');
  const targetSlots = $derived<Slot[]>(target === 'accents' ? ACCENT_SLOTS : BRIGHT_SLOTS);
  let useL = $state(true);
  let useC = $state(true);
  let L = $state(0.7);
  let C = $state(0.12);
  // Start the sliders from the current averages whenever the target or theme changes.
  $effect(() => {
    const s = accentStats(app.theme.palette, targetSlots);
    L = Math.round(s.l * 1000) / 1000;
    C = Math.round(s.c * 1000) / 1000;
  });
  const adjusted = $derived(
    normalizeAccents(p, targetSlots, { l: useL ? L : undefined, c: useC ? C : undefined }),
  );

  function invert() {
    const src = app.theme;
    const inv = invertVariant(src);
    app.addTheme({
      ...JSON.parse(JSON.stringify(src)),
      id: newId(),
      name: `${src.name} (${inv.variant})`,
      slug: undefined,
      variant: inv.variant,
      palette: inv.palette,
      updatedAt: Date.now(),
    });
  }
</script>

<section class="tools">
  <div class="card">
    <h3>{t('grayRamp')}</h3>
    <p class="small muted">{t('grayRampDesc')}</p>
    <div class="strip">
      {#each GRAY_SLOTS as s}<span style:background={p[s]}></span>{/each}
    </div>
    <div class="strip">
      {#each GRAY_SLOTS as s}<span style:background={ramp[s]}></span>{/each}
    </div>
    <label class="ctl">
      <span class="small">{t('easing')} {easing.toFixed(2)}</span>
      <input type="range" min="0.5" max="2" step="0.05" bind:value={easing} />
    </label>
    <button class="primary" onclick={() => app.setColors(grayRamp(p, easing))}>{t('apply')}</button>
  </div>

  <div class="card">
    <h3>{t('accentAdjust')}</h3>
    <p class="small muted">{t('accentAdjustDesc')}</p>
    {#if app.theme.system === 'base24'}
      <div class="seg">
        <button class:on={target === 'accents'} onclick={() => (target = 'accents')}>base08–0F</button>
        <button class:on={target === 'brights'} onclick={() => (target = 'brights')}>base12–17</button>
      </div>
    {/if}
    <div class="strip">
      {#each targetSlots as s}<span style:background={p[s]}></span>{/each}
    </div>
    <div class="strip" style:background={p.base00}>
      {#each targetSlots as s}<span class="on-bg" style:color={adjusted[s]}>●</span>{/each}
    </div>
    <label class="ctl">
      <span class="small"><input type="checkbox" bind:checked={useL} /> {t('lightness')} {useL ? L.toFixed(3) : t('keep')}</span>
      <input type="range" min="0.2" max="0.95" step="0.005" bind:value={L} disabled={!useL} />
    </label>
    <label class="ctl">
      <span class="small"><input type="checkbox" bind:checked={useC} /> {t('chroma')} {useC ? C.toFixed(3) : t('keep')}</span>
      <input type="range" min="0" max="0.3" step="0.002" bind:value={C} disabled={!useC} />
    </label>
    <button class="primary" disabled={!useL && !useC} onclick={() => app.setColors(adjusted)}>{t('apply')}</button>
  </div>

  <div class="card">
    <h3>{t('invert')}</h3>
    <p class="small muted">{t('invertDesc')}</p>
    <button onclick={invert}>{t('createCopy')}</button>
  </div>

  {#if app.theme.system === 'base24'}
    <div class="card">
      <h3>{t('rederive')}</h3>
      <p class="small muted">{t('rederiveDesc')}</p>
      <button onclick={() => app.rederiveBase24()}>{t('run')}</button>
    </div>
  {/if}
</section>

<style>
  .tools { display: flex; flex-direction: column; gap: 12px; }
  .card { border: 1px solid var(--ui-border); border-radius: var(--radius); padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
  h3 { margin: 0; font-size: 14px; }
  p { margin: 0; }
  .strip { display: flex; width: 100%; height: 24px; border-radius: 6px; overflow: hidden; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.3); }
  .strip span { flex: 1; }
  .on-bg { display: grid; place-items: center; font-size: 16px; }
  .ctl { display: flex; flex-direction: column; width: 100%; }
  .ctl input[type='range'] { width: 100%; }
</style>
