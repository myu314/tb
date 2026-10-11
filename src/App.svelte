<script lang="ts">
  import Header from './components/Header.svelte';
  import PaletteList from './components/PaletteList.svelte';
  import Pane from './components/Pane.svelte';
  import SplitView from './components/SplitView.svelte';
  import { t } from './lib/i18n';
  import { layout } from './lib/layout.svelte';
  import { slotsOf } from './lib/scheme';
  import { app } from './lib/state.svelte';

  const mq = window.matchMedia('(min-width: 960px)');
  let wide = $state(mq.matches);
  mq.addEventListener('change', (e) => (wide = e.matches));

  // Keep the selection valid when switching base24 → base16.
  $effect(() => {
    if (!slotsOf(app.theme.system).includes(app.selected)) app.selected = 'base00';
  });

  $effect(() => {
    document.documentElement.lang = app.lang;
  });

  // ---------- phone: drag the palette strip to resize the two panes ----------

  let mobileBox = $state<HTMLElement>();
  let dragging = false;
  function gripDown(e: PointerEvent) {
    dragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function gripMove(e: PointerEvent) {
    if (!dragging || !mobileBox) return;
    const r = mobileBox.getBoundingClientRect();
    layout.setMobileRatio((e.clientY - r.top) / r.height);
  }
  function gripUp() {
    if (!dragging) return;
    dragging = false;
    layout.save();
  }
  function gripKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    layout.setMobileRatio(layout.mobile.ratio + (e.key === 'ArrowDown' ? 0.03 : -0.03));
    layout.save();
  }
</script>

<div class="app">
  <Header />
  {#if wide}
    <main class="desk"><SplitView node={layout.desktop} /></main>
  {:else}
    <main class="mobile" bind:this={mobileBox}>
      <div class="mpane" style:flex-grow={layout.mobile.ratio}>
        <Pane panel={layout.mobile.top} onchange={(k) => layout.setMobilePanel('top', k)} />
      </div>
      <div class="strip">
        <!-- A focusable separator is the ARIA window-splitter pattern; arrow keys resize. -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
        <div
          class="grip"
          role="separator"
          tabindex="0"
          aria-label={t('resize')}
          aria-orientation="horizontal"
          aria-valuenow={Math.round(layout.mobile.ratio * 100)}
          onpointerdown={gripDown}
          onpointermove={gripMove}
          onpointerup={gripUp}
          onpointercancel={gripUp}
          onkeydown={gripKey}
        ><span></span></div>
        <PaletteList compact />
      </div>
      <div class="mpane" style:flex-grow={1 - layout.mobile.ratio}>
        <Pane panel={layout.mobile.bottom} onchange={(k) => layout.setMobilePanel('bottom', k)} />
      </div>
    </main>
  {/if}
</div>

<style>
  .app { height: 100%; display: flex; flex-direction: column; }
  main { flex: 1; min-height: 0; display: flex; }

  .mobile { flex-direction: column; padding-bottom: env(safe-area-inset-bottom); }
  .mpane { flex-basis: 0; flex-shrink: 1; min-height: 0; display: flex; }
  .strip { flex: none; background: var(--ui-panel); border-block: 1px solid var(--ui-border); padding: 0 8px 6px; }
  .grip { height: 18px; display: grid; place-items: center; cursor: row-resize; touch-action: none; outline: none; }
  .grip span { width: 44px; height: 4px; border-radius: 2px; background: var(--ui-border); }
  .grip:hover span, .grip:focus-visible span { background: var(--ui-focus); }
</style>
