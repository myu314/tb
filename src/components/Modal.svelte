<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props { title: string; onclose: () => void; wide?: boolean; children: Snippet; actions?: Snippet; }
  let { title, onclose, wide = false, children, actions }: Props = $props();
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={(e) => e.target === e.currentTarget && onclose()}>
  <div class="dialog" class:wide role="dialog" aria-modal="true" aria-label={title}>
    <header>
      <h2>{title}</h2>
      {@render actions?.()}
      <button class="close" onclick={onclose} aria-label="Close">✕</button>
    </header>
    <div class="content">{@render children()}</div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 0.5);
    z-index: 50;
    display: grid;
    place-items: center;
  }
  .dialog {
    background: var(--ui-panel);
    border: 1px solid var(--ui-border);
    border-radius: 12px;
    width: min(640px, calc(100vw - 24px));
    max-height: calc(100dvh - 24px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 10px 40px rgb(0 0 0 / 0.4);
  }
  .dialog.wide { width: min(1200px, calc(100vw - 24px)); height: calc(100dvh - 24px); }
  header { display: flex; align-items: center; gap: 8px; padding: 8px 10px 8px 16px; border-bottom: 1px solid var(--ui-border); }
  h2 { font-size: 16px; margin: 0; flex: 1; }
  .close { min-width: 34px; }
  .content { flex: 1; min-height: 0; overflow: auto; }
  @media (max-width: 640px) {
    .backdrop { place-items: stretch; }
    .dialog, .dialog.wide { width: 100vw; height: 100dvh; max-height: none; border-radius: 0; border: 0; }
    header { padding-top: max(8px, env(safe-area-inset-top)); }
  }
</style>
