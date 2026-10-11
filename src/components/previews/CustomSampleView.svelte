<script lang="ts">
  import { untrack } from 'svelte';
  import previewCss from './preview.css?inline';
  import { sanitizeHtml, textToHtml, type CustomSample } from '../../lib/samples.svelte';

  // `hl` mirrors the outer preview's role highlight, which can't reach into the shadow root.
  let { sample, hl = null }: { sample: Pick<CustomSample, 'format' | 'source'>; hl?: string | null } = $props();

  let host = $state<HTMLDivElement>();
  // Reactive so the highlight effect below re-runs once the shadow root exists.
  let root = $state.raw<ShadowRoot | null>(null);

  const text = $derived(sample.format === 'text' ? textToHtml(sample.source) : null);

  // HTML mock-ups get a shadow root so their <style> can't restyle the app.
  // Re-render only when the source changes; the highlight is kept in sync by the next effect.
  $effect(() => {
    if (sample.format !== 'html' || !host) return;
    const html = sanitizeHtml(sample.source);
    untrack(() => {
      const r = root ?? host!.shadowRoot ?? host!.attachShadow({ mode: 'open' });
      r.innerHTML =
        `<style>:host{display:block;height:100%}.pv{height:100%;min-height:100%}${previewCss}</style>` +
        `<div class="pv">${html}</div>`;
      root = r;
    });
  });
  $effect(() => {
    const code = hl;
    sample.source; // re-apply after the content is replaced
    const inner = root?.querySelector('.pv');
    if (!inner) return;
    if (code) inner.setAttribute('data-hl', code);
    else inner.removeAttribute('data-hl');
  });
</script>

{#if text}
  <div class="txt b-{text.bg} f-{text.fg}">{@html text.html}</div>
{:else}
  <div class="html" bind:this={host}></div>
{/if}

<style>
  .txt { font-family: var(--mono); font-size: 12.5px; line-height: 1.6; padding: 6px 0; min-height: 100%; }
  .txt :global(.ln) { white-space: pre; padding: 0 10px; min-height: 1.6em; }
  .html { min-height: 100%; height: 100%; }
</style>
