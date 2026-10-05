<script lang="ts">
  import { t } from '../lib/i18n';
  import { downloadText, fromYaml, shareUrl, toYaml } from '../lib/io';
  import { slugify } from '../lib/scheme';
  import { app } from '../lib/state.svelte';

  const yaml = $derived(toYaml(app.theme));
  const url = $derived(shareUrl(app.theme));
  let toast = $state('');
  let importText = $state('');
  let importError = $state('');

  function flash(msg: string) {
    toast = msg;
    setTimeout(() => (toast = ''), 1600);
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      flash(t('copied'));
    } catch {
      flash('✗');
    }
  }

  async function shareNative() {
    if (navigator.share) {
      try { await navigator.share({ title: app.theme.name, url }); } catch {}
    } else {
      copy(url);
    }
  }

  function doImport(text: string) {
    importError = '';
    try {
      app.addTheme(fromYaml(text));
      importText = '';
      flash(t('imported'));
    } catch (e) {
      importError = (e as Error).message;
    }
  }

  async function onFile(e: Event) {
    const f = (e.currentTarget as HTMLInputElement).files?.[0];
    if (f) doImport(await f.text());
    (e.currentTarget as HTMLInputElement).value = '';
  }
</script>

<section class="export">
  <div class="card">
    <h3>{app.theme.system} YAML</h3>
    <pre class="mono">{yaml}</pre>
    <div class="btns">
      <button class="primary" onclick={() => copy(yaml)}>{t('copy')}</button>
      <button onclick={() => downloadText(`${app.theme.slug || slugify(app.theme.name)}.yaml`, yaml)}>{t('download')}</button>
    </div>
  </div>

  <div class="card">
    <h3>{t('share')}</h3>
    <p class="small muted">{t('shareDesc')}</p>
    <input class="mono small url" type="text" readonly value={url} onfocus={(e) => e.currentTarget.select()} />
    <div class="btns">
      <button onclick={() => copy(url)}>{t('copy')}</button>
      {#if 'share' in navigator}<button onclick={shareNative}>↗ Share</button>{/if}
    </div>
  </div>

  <div class="card">
    <h3>{t('import')}</h3>
    <p class="small muted">{t('importDesc')}</p>
    <textarea rows="6" bind:value={importText} placeholder={'system: "base16"\nname: "..."\npalette:\n  base00: "#1d1f21"\n  ...'}></textarea>
    {#if importError}<div class="err small">{importError}</div>{/if}
    <div class="btns">
      <button class="primary" disabled={!importText.trim()} onclick={() => doImport(importText)}>{t('importBtn')}</button>
      <label class="file">
        <input type="file" accept=".yaml,.yml,text/yaml,text/plain" onchange={onFile} />
        <span>{t('chooseFile')}</span>
      </label>
    </div>
  </div>
  {#if toast}<div class="toast" role="status">{toast}</div>{/if}
</section>

<style>
  .export { display: flex; flex-direction: column; gap: 12px; }
  .card { border: 1px solid var(--ui-border); border-radius: var(--radius); padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
  h3 { margin: 0; font-size: 14px; }
  p { margin: 0; }
  pre { margin: 0; font-size: 12px; background: var(--ui-panel-2); border-radius: 6px; padding: 8px; overflow: auto; max-height: 40vh; }
  .btns { display: flex; gap: 8px; flex-wrap: wrap; }
  .url { width: 100%; }
  .err { color: var(--ui-bad); }
  .file { position: relative; display: inline-flex; align-items: center; border: 1px solid var(--ui-border); border-radius: 6px; padding: 4px 10px; min-height: 32px; background: var(--ui-panel-2); cursor: pointer; }
  .file input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .toast {
    position: fixed;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    background: var(--ui-text);
    color: var(--ui-bg);
    padding: 6px 14px;
    border-radius: 999px;
    z-index: 100;
  }
</style>
