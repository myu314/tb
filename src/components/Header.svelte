<script lang="ts">
  import { t } from '../lib/i18n';
  import Credits from './Credits.svelte';
  import Gallery from './Gallery.svelte';
  import NewTheme from './NewTheme.svelte';
  import { layout } from '../lib/layout.svelte';
  import { deriveBase24, slugify, type System, type Variant } from '../lib/scheme';
  import { app } from '../lib/state.svelte';

  let open = $state(false);
  let showGallery = $state(false);
  let showCredits = $state(false);
  let showNew = $state(false);

  function setSystem(s: System) {
    if (s === app.theme.system) return;
    app.edit((th) => {
      if (s === 'base24') Object.assign(th.palette, deriveBase24(th.palette, th.variant));
      th.system = s;
    });
  }
  function setVariant(v: Variant) {
    if (v !== app.theme.variant) app.edit((th) => (th.variant = v));
  }
  // Name/author edits are not worth an undo step per keystroke.
  function setMeta(field: 'name' | 'author' | 'description', value: string) {
    app.theme[field] = value;
    if (field === 'name') app.theme.slug = slugify(value);
    app.save();
  }
  function remove() {
    if (app.themes.length > 1 && confirm(t('confirmDelete'))) app.remove(app.currentId);
  }
  function onKey(e: KeyboardEvent) {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod || (e.target as HTMLElement).matches('input, textarea')) return;
    if (e.key.toLowerCase() === 'z') {
      e.preventDefault();
      e.shiftKey ? app.redo() : app.undo();
    } else if (e.key.toLowerCase() === 'y') {
      e.preventDefault();
      app.redo();
    }
  }
</script>

<svelte:window onkeydown={onKey} />

<header class="hdr">
  <div class="bar">
    <img src="./icon.svg" alt="" width="22" height="22" />
    <select class="themes" value={app.currentId} onchange={(e) => app.select(e.currentTarget.value)} aria-label={t('themes')}>
      {#each app.themes as th (th.id)}
        <option value={th.id}>{th.name}</option>
      {/each}
    </select>
    <button class="icon" class:on={open} onclick={() => (open = !open)} aria-expanded={open} title={t('themes')}>⚙</button>
    <button class="icon" onclick={() => (showNew = true)} title={t('newTheme')} aria-label={t('newTheme')}>＋</button>
    <button class="gal" onclick={() => (showGallery = true)}>▦ <span class="lbl">{t('gallery')}</span></button>
    <span class="sp"></span>
    <button class="icon" disabled={!app.canUndo} onclick={() => app.undo()} title="{t('undo')} (Ctrl+Z)" aria-label={t('undo')}>↶</button>
    <button class="icon" disabled={!app.canRedo} onclick={() => app.redo()} title="{t('redo')} (Ctrl+Shift+Z)" aria-label={t('redo')}>↷</button>
    <button
      class="icon"
      class:on={layout.locked}
      aria-pressed={layout.locked}
      onclick={() => layout.toggleLock()}
      title={layout.locked ? t('unlockLayout') : t('lockLayout')}
      aria-label={t('lockLayout')}
    >
      <svg class="lock" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="3" y="7" width="10" height="7" rx="1.5" />
        {#if layout.locked}<path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />{:else}<path d="M5.5 7V5a2.5 2.5 0 0 1 4.9-.7" />{/if}
      </svg>
    </button>
    <button class="icon lang" onclick={() => { app.lang = app.lang === 'ja' ? 'en' : 'ja'; app.save(); }}>{app.lang === 'ja' ? 'EN' : 'JA'}</button>
  </div>

  {#if open}
    <div class="meta">
      <label>
        <span class="small muted">{t('name')}</span>
        <input type="text" value={app.theme.name} oninput={(e) => setMeta('name', e.currentTarget.value)} />
      </label>
      <label>
        <span class="small muted">{t('author')}</span>
        <input type="text" value={app.theme.author} oninput={(e) => setMeta('author', e.currentTarget.value)} />
      </label>
      <label class="wide">
        <span class="small muted">{t('description')}</span>
        <input type="text" value={app.theme.description ?? ''} oninput={(e) => setMeta('description', e.currentTarget.value)} />
      </label>
      <div class="field">
        <span class="small muted">{t('system')}</span>
        <div class="seg">
          <button class:on={app.theme.system === 'base16'} onclick={() => setSystem('base16')}>base16</button>
          <button class:on={app.theme.system === 'base24'} onclick={() => setSystem('base24')}>base24</button>
        </div>
      </div>
      <div class="field">
        <span class="small muted">{t('variant')}</span>
        <div class="seg">
          <button class:on={app.theme.variant === 'dark'} onclick={() => setVariant('dark')}>{t('dark')}</button>
          <button class:on={app.theme.variant === 'light'} onclick={() => setVariant('light')}>{t('light')}</button>
        </div>
      </div>
      {#if app.theme.system === 'base16'}<p class="small muted note">{t('toBase24')}</p>{/if}
      <div class="actions">
        <button onclick={() => (showNew = true)}>＋ {t('newFromPreset')}</button>
        <button onclick={() => app.duplicate()}>{t('duplicate')}</button>
        <button disabled={app.themes.length <= 1} onclick={remove}>{t('delete')}</button>
        <span class="sp"></span>
        <button disabled={layout.locked} onclick={() => layout.reset()}>{t('resetLayout')}</button>
        <button onclick={() => (showCredits = true)}>ⓘ {t('credits')}</button>
      </div>
      <p class="small muted note">{t('install')}</p>
    </div>
  {/if}
</header>

{#if showGallery}<Gallery onclose={() => (showGallery = false)} />{/if}
{#if showNew}<NewTheme onclose={() => (showNew = false)} onopengallery={() => { showNew = false; showGallery = true; }} />{/if}
{#if showCredits}<Credits onclose={() => (showCredits = false)} />{/if}

<style>
  .hdr { background: var(--ui-panel); border-bottom: 1px solid var(--ui-border); padding: 6px 10px; padding-top: max(6px, env(safe-area-inset-top)); }
  .bar { display: flex; gap: 6px; align-items: center; }
  .themes { max-width: 50vw; font-weight: 600; }
  .icon { min-width: 34px; padding: 2px 6px; font-size: 16px; }
  .icon.on { background: var(--ui-accent); color: var(--ui-bg); }
  .lang { font-size: 12px; font-weight: 600; }
  .lock { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; display: block; margin: auto; }
  .sp { flex: 1; }
  .meta { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px 12px; padding: 10px 0 4px; }
  label, .field { display: flex; flex-direction: column; gap: 2px; }
  .actions { display: flex; gap: 6px; flex-wrap: wrap; grid-column: 1 / -1; }
  .wide { grid-column: 1 / -1; }
  .gal { white-space: nowrap; }
  @media (max-width: 420px) {
    .gal .lbl { display: none; }
    /* Make room for the theme name next to the icon buttons. */
    .bar { gap: 4px; }
    .bar img { display: none; }
    .icon, .gal { min-width: 32px; padding: 2px 4px; }
    .themes { flex: 1; min-width: 0; max-width: none; }
    .bar > .sp { display: none; }
  }
  .note { margin: 0; grid-column: 1 / -1; }
</style>
