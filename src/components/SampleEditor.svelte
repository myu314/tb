<script lang="ts">
  import './previews/preview.css';
  import { t } from '../lib/i18n';
  import { downloadText } from '../lib/io';
  import { previewVars } from '../lib/preview';
  import { exportBundle, parseBundle, samples, STARTERS, type SampleFormat } from '../lib/samples.svelte';
  import { slugify } from '../lib/scheme';
  import { app } from '../lib/state.svelte';
  import Modal from './Modal.svelte';
  import CustomSampleView from './previews/CustomSampleView.svelte';

  interface Props {
    /** Sample to edit; omitted to create a new one. */
    id?: string;
    onclose: () => void;
    onsaved: (id: string) => void;
    ondeleted?: () => void;
  }
  let { id, onclose, onsaved, ondeleted }: Props = $props();

  // svelte-ignore state_referenced_locally
  const existing = id ? samples.get(id) : undefined;
  let name = $state(existing?.name ?? t('customSample'));
  let format = $state<SampleFormat>(existing?.format ?? 'text');
  let source = $state(existing?.source ?? STARTERS.text);
  let message = $state('');

  function setFormat(f: SampleFormat) {
    // Swap in the other starter while the text is still the untouched starter.
    if (source === STARTERS[format] || !source.trim()) source = STARTERS[f];
    format = f;
  }

  function save() {
    onsaved(samples.put({ id, name: name.trim() || t('customSample'), format, source }));
  }

  function remove() {
    if (id && confirm(t('confirmDeleteSample'))) {
      samples.remove(id);
      ondeleted?.();
    }
  }

  async function onFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const text = await file.text();
    try {
      if (/\.json$/i.test(file.name)) {
        const list = parseBundle(text);
        samples.addAll(list);
        message = `${t('sampleImported')} (${list.length})`;
        return;
      }
      format = /\.html?$/i.test(file.name) ? 'html' : 'text';
      source = text;
      if (name === t('customSample')) name = file.name.replace(/\.[^.]+$/, '');
    } catch (err) {
      message = (err as Error).message;
    }
  }

  function saveFile() {
    const ext = format === 'html' ? 'html' : 'txt';
    downloadText(`${slugify(name)}.${ext}`, source, format === 'html' ? 'text/html' : 'text/plain');
  }
</script>

<Modal title={id ? t('editSample') : t('newSample')} {onclose} wide>
  <div class="editor">
    <div class="form">
      <div class="row-flex">
        <label class="name">
          <span class="small muted">{t('sampleName')}</span>
          <input type="text" bind:value={name} />
        </label>
        <div class="field">
          <span class="small muted">{t('format')}</span>
          <div class="seg">
            <button class:on={format === 'text'} onclick={() => setFormat('text')}>{t('formatText')}</button>
            <button class:on={format === 'html'} onclick={() => setFormat('html')}>{t('formatHtml')}</button>
          </div>
        </div>
      </div>
      <textarea class="src" bind:value={source} wrap="off" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label={t('customSample')}></textarea>
      <details>
        <summary class="small">{t('syntaxHelp')}</summary>
        <p class="small muted">{format === 'text' ? t('textHelp') : t('htmlHelp')}</p>
        <button class="small" onclick={() => (source = STARTERS[format])}>{t('useStarter')}</button>
      </details>
      <div class="row-flex">
        <label class="file">
          <input type="file" accept=".txt,.html,.htm,.json,text/plain,text/html,application/json" onchange={onFile} />
          <span>{t('loadFile')}</span>
        </label>
        <button onclick={saveFile}>{t('saveFile')}</button>
        {#if samples.list.length}
          <button onclick={() => downloadText('theme-bench-samples.json', exportBundle(samples.list), 'application/json')}>{t('exportAllSamples')}</button>
        {/if}
      </div>
      {#if message}<p class="small msg" role="status">{message}</p>{/if}
      <div class="row-flex actions">
        {#if id}<button onclick={remove}>{t('delete')}</button>{/if}
        <span class="sp"></span>
        <button onclick={onclose}>{t('cancel')}</button>
        <button class="primary" onclick={save}>{t('save')}</button>
      </div>
    </div>
    <div class="live pv" style={previewVars(app.theme)}>
      <CustomSampleView sample={{ format, source }} />
    </div>
  </div>
</Modal>

<style>
  .editor { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); height: 100%; min-height: 0; }
  .form { display: flex; flex-direction: column; gap: 8px; padding: 12px; min-height: 0; overflow: auto; border-right: 1px solid var(--ui-border); }
  .name { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 160px; }
  .field { display: flex; flex-direction: column; gap: 2px; }
  .src { flex: 1; min-height: 220px; font-size: 12.5px; line-height: 1.5; tab-size: 2; white-space: pre; overflow-x: auto; }
  details p { margin: 6px 0; line-height: 1.6; }
  .file { position: relative; display: inline-flex; align-items: center; border: 1px solid var(--ui-border); border-radius: 6px; padding: 4px 10px; min-height: 32px; background: var(--ui-panel-2); cursor: pointer; }
  .file input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .actions { margin-top: auto; padding-top: 8px; border-top: 1px solid var(--ui-border); }
  .sp { flex: 1; }
  .live { overflow: auto; background: var(--base00); min-height: 0; }
  @media (max-width: 760px) {
    .editor { grid-template-columns: 1fr; grid-template-rows: auto minmax(200px, 40dvh); }
    .form { border-right: 0; border-bottom: 1px solid var(--ui-border); overflow: visible; }
    .src { min-height: 180px; }
  }
</style>
