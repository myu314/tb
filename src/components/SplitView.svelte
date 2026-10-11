<script lang="ts">
  import { t } from '../lib/i18n';
  import { layout, type LayoutNode } from '../lib/layout.svelte';
  import Pane from './Pane.svelte';
  import SplitView from './SplitView.svelte';

  let { node }: { node: LayoutNode } = $props();

  let box = $state<HTMLDivElement>();
  let dragging = false;

  function ratioAt(e: PointerEvent) {
    if (node.type !== 'split' || !box) return;
    const r = box.getBoundingClientRect();
    const v = node.dir === 'row' ? (e.clientX - r.left) / r.width : (e.clientY - r.top) / r.height;
    layout.setRatio(node.id, v);
  }
  function down(e: PointerEvent) {
    dragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function move(e: PointerEvent) {
    if (dragging) ratioAt(e);
  }
  function up() {
    if (!dragging) return;
    dragging = false;
    layout.save();
  }
  function key(e: KeyboardEvent) {
    if (node.type !== 'split') return;
    const back = node.dir === 'row' ? 'ArrowLeft' : 'ArrowUp';
    const fwd = node.dir === 'row' ? 'ArrowRight' : 'ArrowDown';
    if (e.key !== back && e.key !== fwd) return;
    e.preventDefault();
    layout.setRatio(node.id, node.ratio + (e.key === fwd ? 0.02 : -0.02));
    layout.save();
  }
</script>

{#if node.type === 'leaf'}
  <Pane
    panel={node.panel}
    onchange={(k) => layout.setPanel(node.id, k)}
    onsplit={(dir) => layout.split(node.id, dir)}
    onclose={layout.leafCount > 1 ? () => layout.remove(node.id) : undefined}
    canSplit={layout.canSplit}
  />
{:else}
  <div class="split {node.dir}" bind:this={box}>
    <div class="part" style:flex-grow={node.ratio}><SplitView node={node.a} /></div>
    <!-- A focusable separator is the ARIA window-splitter pattern; arrow keys resize. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
    <div
      class="divider"
      role="separator"
      tabindex="0"
      aria-label={t('resize')}
      aria-orientation={node.dir === 'row' ? 'vertical' : 'horizontal'}
      aria-valuenow={Math.round(node.ratio * 100)}
      onpointerdown={down}
      onpointermove={move}
      onpointerup={up}
      onpointercancel={up}
      onkeydown={key}
    ></div>
    <div class="part" style:flex-grow={1 - node.ratio}><SplitView node={node.b} /></div>
  </div>
{/if}

<style>
  .split { display: flex; width: 100%; height: 100%; min-width: 0; min-height: 0; }
  .split.col { flex-direction: column; }
  .part { flex-basis: 0; flex-shrink: 1; min-width: 0; min-height: 0; display: flex; }
  .divider { flex: none; background: var(--ui-border); position: relative; touch-action: none; z-index: 1; }
  .row > .divider { width: 1px; cursor: col-resize; }
  .col > .divider { height: 1px; cursor: row-resize; }
  /* Wider invisible grab area around the 1px line. */
  .divider::before { content: ''; position: absolute; inset: -4px; }
  .row > .divider::before { inset: 0 -4px; }
  .col > .divider::before { inset: -4px 0; }
  .divider:hover, .divider:focus-visible { background: var(--ui-focus); outline: none; }
</style>
