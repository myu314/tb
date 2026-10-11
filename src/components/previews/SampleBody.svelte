<script lang="ts">
  import { samples } from '../../lib/samples.svelte';
  import CodePreview from './CodePreview.svelte';
  import CustomSampleView from './CustomSampleView.svelte';
  import FilerPreview from './FilerPreview.svelte';
  import MarkdownPreview from './MarkdownPreview.svelte';
  import TerminalPreview from './TerminalPreview.svelte';
  import TrackerPreview from './TrackerPreview.svelte';

  /** A built-in sample name, or "custom:<id>". */
  let { sample, hl = null }: { sample: string; hl?: string | null } = $props();
  const custom = $derived(sample.startsWith('custom:') ? samples.get(sample.slice(7)) : undefined);
</script>

{#if sample === 'code'}<CodePreview />
{:else if sample === 'markdown'}<MarkdownPreview />
{:else if sample === 'terminal'}<TerminalPreview />
{:else if sample === 'tracker'}<TrackerPreview />
{:else if sample === 'filer'}<FilerPreview />
{:else if custom}<CustomSampleView sample={custom} {hl} />
{:else}<CodePreview />{/if}
