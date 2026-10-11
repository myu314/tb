<script lang="ts">
  import type { PanelKind } from '../lib/layout.svelte';
  import ExportPanel from './ExportPanel.svelte';
  import PaletteList from './PaletteList.svelte';
  import ComparePanel from './panels/ComparePanel.svelte';
  import DistinctPanel from './panels/DistinctPanel.svelte';
  import MatrixPanel from './panels/MatrixPanel.svelte';
  import PairsPanel from './panels/PairsPanel.svelte';
  import Picker from './Picker.svelte';
  import Preview from './Preview.svelte';
  import ToolsPanel from './ToolsPanel.svelte';

  let { panel }: { panel: PanelKind } = $props();
</script>

{#if panel === 'picker'}<Picker />
{:else if panel === 'palette'}<PaletteList />
{:else if panel === 'samples'}<Preview />
{:else if panel === 'pairs'}<PairsPanel />
{:else if panel === 'matrix'}<MatrixPanel />
{:else if panel === 'compare'}<ComparePanel />
{:else if panel === 'distinct'}<DistinctPanel />
{:else if panel === 'tools'}<ToolsPanel />
{:else}<ExportPanel />{/if}
