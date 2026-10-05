<script lang="ts">
  import license from '../data/schemes-LICENSE.txt?raw';
  import { t } from '../lib/i18n';
  import { loadSchemes, type SchemeData } from '../lib/presets';
  import Modal from './Modal.svelte';

  interface Props { onclose: () => void; }
  let { onclose }: Props = $props();

  let data = $state<SchemeData | null>(null);
  loadSchemes().then((d) => (data = d));

  const software = [
    { name: 'Svelte', license: 'MIT', url: 'https://svelte.dev' },
    { name: 'Vite / vite-plugin-pwa', license: 'MIT', url: 'https://vite.dev' },
    { name: 'Workbox', license: 'MIT', url: 'https://developer.chrome.com/docs/workbox' },
    { name: 'yaml', license: 'ISC', url: 'https://eemeli.org/yaml/' },
    { name: 'APCA (contrast algorithm)', license: 'W3C / Myndex', url: 'https://github.com/Myndex/apca-w3' },
  ];
</script>

<Modal title={t('credits')} {onclose}>
  <div class="credits">
    <p>{t('creditsIntro')}</p>
    <p class="small muted">{t('creditsDerived')}</p>

    <h3>{t('dataSource')}</h3>
    <p class="small">
      <a href="https://github.com/tinted-theming/schemes" target="_blank" rel="noopener">tinted-theming/schemes</a>
      {#if data}
        · {data.schemes.length} schemes ·
        <a class="mono" href="https://github.com/tinted-theming/schemes/tree/{data.commit}" target="_blank" rel="noopener">{data.commit.slice(0, 7)}</a>
        ({data.date})
      {/if}
    </p>
    <pre class="mono">{license}</pre>

    <h3>{t('software')}</h3>
    <ul class="small">
      {#each software as s}
        <li><a href={s.url} target="_blank" rel="noopener">{s.name}</a> <span class="muted">— {s.license}</span></li>
      {/each}
    </ul>
  </div>
</Modal>

<style>
  .credits { padding: 4px 16px 16px; }
  h3 { font-size: 14px; margin: 16px 0 4px; }
  p { margin: 8px 0; line-height: 1.7; }
  pre { font-size: 11px; white-space: pre-wrap; background: var(--ui-panel-2); padding: 10px; border-radius: 6px; }
  a { color: inherit; }
  ul { padding-left: 1.2em; }
</style>
