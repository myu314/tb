<script lang="ts">
  import ContrastPanel from './components/ContrastPanel.svelte';
  import ExportPanel from './components/ExportPanel.svelte';
  import Header from './components/Header.svelte';
  import PaletteList from './components/PaletteList.svelte';
  import Picker from './components/Picker.svelte';
  import Preview from './components/Preview.svelte';
  import ToolsPanel from './components/ToolsPanel.svelte';
  import { t, type Key } from './lib/i18n';
  import { slotsOf } from './lib/scheme';
  import { app } from './lib/state.svelte';

  type Tab = 'picker' | 'roles' | 'contrast' | 'tools' | 'export';

  const mq = window.matchMedia('(min-width: 960px)');
  let wide = $state(mq.matches);
  mq.addEventListener('change', (e) => (wide = e.matches));

  let tab = $state<Tab>('picker');

  // Phone: the top half shows either the samples or the contrast panel next to the picker below.
  const savedView = (() => { try { return localStorage.getItem('theme-bench:top-view'); } catch { return null; } })();
  let topView = $state<'samples' | 'contrast'>(savedView === 'contrast' ? 'contrast' : 'samples');
  $effect(() => {
    try { localStorage.setItem('theme-bench:top-view', topView); } catch {}
  });
  // On desktop the palette list is always visible, so there is no "roles" tab.
  const tabs = $derived<Tab[]>(wide ? ['picker', 'contrast', 'tools', 'export'] : ['picker', 'roles', 'contrast', 'tools', 'export']);
  $effect(() => {
    if (!tabs.includes(tab)) tab = 'picker';
  });

  // Keep the selection valid when switching base24 → base16.
  $effect(() => {
    if (!slotsOf(app.theme.system).includes(app.selected)) app.selected = 'base00';
  });

  $effect(() => {
    document.documentElement.lang = app.lang;
  });
</script>

<div class="app" class:wide>
  <Header />
  {#if wide}
    <main class="desk">
      <aside class="col palette"><PaletteList /></aside>
      <section class="col editor">
        <nav class="seg tabbar">
          {#each tabs as k}<button class:on={tab === k} onclick={() => (tab = k)}>{t(k as Key)}</button>{/each}
        </nav>
        <div class="scroll">
          {#if tab === 'picker'}
            <Picker />
            <div class="dock">
              <h3 class="small muted">{t('contrast')}</h3>
              <ContrastPanel docked />
            </div>
          {:else if tab === 'contrast'}<ContrastPanel />
          {:else if tab === 'tools'}<ToolsPanel />
          {:else}<ExportPanel />{/if}
        </div>
      </section>
      <section class="col samples"><Preview /></section>
    </main>
  {:else}
    <main class="mobile">
      <div class="top">
        <div class="seg view" role="tablist">
          <button class:on={topView === 'samples'} role="tab" aria-selected={topView === 'samples'} onclick={() => (topView = 'samples')}>{t('sampleView')}</button>
          <button class:on={topView === 'contrast'} role="tab" aria-selected={topView === 'contrast'} onclick={() => (topView = 'contrast')}>{t('contrast')}</button>
        </div>
        {#if topView === 'samples'}<div class="topbody"><Preview /></div>{:else}<div class="topcontrast"><ContrastPanel docked /></div>{/if}
      </div>
      <div class="strip"><PaletteList compact /></div>
      <nav class="mtabs">
        {#each tabs as k}<button class:on={tab === k} onclick={() => (tab = k)}>{t(k as Key)}</button>{/each}
      </nav>
      <div class="bottom">
        {#if tab === 'picker'}<Picker />
        {:else if tab === 'roles'}<PaletteList onpick={() => (tab = 'picker')} />
        {:else if tab === 'contrast'}<ContrastPanel />
        {:else if tab === 'tools'}<ToolsPanel />
        {:else}<ExportPanel />{/if}
      </div>
    </main>
  {/if}
</div>

<style>
  .app { height: 100%; display: flex; flex-direction: column; }
  main { flex: 1; min-height: 0; }

  .desk { display: grid; grid-template-columns: minmax(250px, 300px) minmax(340px, 400px) 1fr; }
  .col { min-height: 0; overflow: auto; padding: 12px; }
  .palette { border-right: 1px solid var(--ui-border); background: var(--ui-panel); }
  .editor { display: flex; flex-direction: column; padding: 0; border-right: 1px solid var(--ui-border); background: var(--ui-panel); overflow: hidden; }
  .tabbar { margin: 10px 12px 0; align-self: flex-start; }
  .editor .scroll { overflow: auto; padding: 12px; flex: 1; }
  .samples { display: flex; flex-direction: column; }
  .dock { margin-top: 16px; padding-top: 10px; border-top: 1px solid var(--ui-border); }
  .dock h3 { margin: 0 0 6px; font-weight: 600; }
  .view { flex: none; margin-bottom: 4px; }
  .view button { min-height: 26px; font-size: 12px; padding: 0 10px; }
  .topbody { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .topcontrast { flex: 1; min-height: 0; overflow: auto; padding: 6px 4px 8px; border-radius: 6px; box-shadow: inset 0 0 0 1px var(--ui-border); background: var(--ui-panel); overscroll-behavior: contain; }

  .mobile { display: flex; flex-direction: column; }
  .top { height: 44dvh; min-height: 220px; padding: 6px 8px 0; flex: none; display: flex; flex-direction: column; }
  .strip { padding: 6px 8px; flex: none; background: var(--ui-panel); border-top: 1px solid var(--ui-border); }
  .mtabs { display: flex; flex: none; border-bottom: 1px solid var(--ui-border); background: var(--ui-panel); overflow-x: auto; scrollbar-width: none; }
  .mtabs button { flex: 1; border: 0; border-radius: 0; background: transparent; color: var(--ui-muted); border-bottom: 2px solid transparent; white-space: nowrap; font-size: 13px; padding: 4px 6px; }
  .mtabs button.on { color: var(--ui-text); border-bottom-color: var(--ui-accent); font-weight: 600; }
  .bottom { flex: 1; overflow: auto; padding: 12px; padding-bottom: max(16px, env(safe-area-inset-bottom)); background: var(--ui-panel); overscroll-behavior: contain; }
</style>
