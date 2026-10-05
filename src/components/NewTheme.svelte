<script lang="ts">
  import { t, type Key } from '../lib/i18n';
  import { BASE16_SLOTS, BASE24_EXTRA, type System, type Variant } from '../lib/scheme';
  import { app } from '../lib/state.svelte';
  import { blankTheme, templatePalette, TEMPLATE_KINDS, type TemplateKind } from '../lib/templates';
  import Modal from './Modal.svelte';

  interface Props { onclose: () => void; onopengallery: () => void; }
  let { onclose, onopengallery }: Props = $props();

  const AUTHOR_KEY = 'theme-bench:author';
  const savedAuthor = (() => { try { return localStorage.getItem(AUTHOR_KEY) ?? ''; } catch { return ''; } })();

  let name = $state(t('untitled'));
  let author = $state(savedAuthor);
  let system = $state<System>('base16');
  let variant = $state<Variant>('dark');
  let kind = $state<TemplateKind | 'gallery'>('basic');

  const LABEL: Record<TemplateKind | 'gallery', Key> = {
    black: 'tplBlack', white: 'tplWhite', basic: 'tplBasic', grays: 'tplGrays', gallery: 'tplGallery',
  };
  const DESC: Partial<Record<TemplateKind | 'gallery', Key>> = {
    basic: 'tplBasicDesc', grays: 'tplGraysDesc', gallery: 'tplGalleryDesc',
  };

  function strips(k: TemplateKind) {
    const p = templatePalette(k, variant);
    const band = (slots: readonly string[]) =>
      `linear-gradient(to right, ${slots
        .map((s, i) => `${p[s as 'base00']} ${(i / slots.length) * 100}% ${((i + 1) / slots.length) * 100}%`)
        .join(', ')})`;
    return [band(BASE16_SLOTS.slice(0, 8)), band(BASE16_SLOTS.slice(8)), ...(system === 'base24' ? [band(BASE24_EXTRA)] : [])];
  }

  function create() {
    if (kind === 'gallery') {
      onopengallery();
      return;
    }
    try { localStorage.setItem(AUTHOR_KEY, author); } catch {}
    app.addTheme(blankTheme({ kind, system, variant, name: name.trim() || t('untitled'), author }));
    app.selected = 'base00';
    onclose();
  }
</script>

<Modal title={t('newTheme')} {onclose}>
  <form class="new" onsubmit={(e) => { e.preventDefault(); create(); }}>
    <div class="row2">
      <label>
        <span class="small muted">{t('name')}</span>
        <input type="text" bind:value={name} disabled={kind === 'gallery'} />
      </label>
      <label>
        <span class="small muted">{t('author')}</span>
        <input type="text" bind:value={author} disabled={kind === 'gallery'} />
      </label>
    </div>
    <div class="row2">
      <div class="field">
        <span class="small muted">{t('system')}</span>
        <div class="seg">
          <button type="button" class:on={system === 'base16'} disabled={kind === 'gallery'} onclick={() => (system = 'base16')}>base16</button>
          <button type="button" class:on={system === 'base24'} disabled={kind === 'gallery'} onclick={() => (system = 'base24')}>base24</button>
        </div>
      </div>
      <div class="field">
        <span class="small muted">{t('variant')}</span>
        <div class="seg">
          <button type="button" class:on={variant === 'dark'} disabled={kind === 'gallery'} onclick={() => (variant = 'dark')}>{t('dark')}</button>
          <button type="button" class:on={variant === 'light'} disabled={kind === 'gallery'} onclick={() => (variant = 'light')}>{t('light')}</button>
        </div>
      </div>
    </div>

    <div class="field">
      <span class="small muted">{t('startFrom')}</span>
      <div class="cards" role="radiogroup" aria-label={t('startFrom')}>
        {#each [...TEMPLATE_KINDS, 'gallery'] as const as k}
          <button type="button" class="card" class:sel={kind === k} role="radio" aria-checked={kind === k} onclick={() => (kind = k)}>
            {#if k === 'gallery'}
              <span class="gal">▦</span>
            {:else}
              {#each strips(k) as bg}<span class="strip" style:background={bg}></span>{/each}
            {/if}
            <span class="label">{t(LABEL[k])}</span>
            {#if DESC[k]}<span class="small muted">{t(DESC[k]!)}</span>{/if}
          </button>
        {/each}
      </div>
    </div>

    <div class="actions">
      <button type="button" onclick={onclose}>✕</button>
      <button type="submit" class="primary">{kind === 'gallery' ? t('openGallery') : t('create')}</button>
    </div>
  </form>
</Modal>

<style>
  .new { display: flex; flex-direction: column; gap: 12px; padding: 12px 16px 16px; }
  .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  label, .field { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
  .card { display: flex; flex-direction: column; gap: 3px; align-items: stretch; text-align: left; padding: 8px; border-radius: 8px; background: var(--ui-panel); min-height: 92px; }
  .card.sel { border-color: var(--ui-accent); box-shadow: 0 0 0 1px var(--ui-accent); }
  .strip { height: 14px; border-radius: 3px; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.3); }
  .gal { height: 31px; display: grid; place-items: center; font-size: 22px; color: var(--ui-muted); border-radius: 3px; background: var(--ui-panel-2); }
  .label { font-weight: 600; margin-top: 2px; }
  .actions { display: flex; justify-content: flex-end; gap: 8px; }
  @media (max-width: 420px) { .row2 { grid-template-columns: 1fr; } }
</style>
