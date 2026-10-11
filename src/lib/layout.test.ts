import { describe, expect, it } from 'vitest';
import {
  countLeaves, defaultDesktop, MAX_LEAVES, MIN_RATIO, removeLeaf, setPanel, setRatio, splitLeaf, suggestPanel,
  type LayoutNode,
} from './layout.svelte';

const leaves = (n: LayoutNode): LayoutNode[] => (n.type === 'leaf' ? [n] : [...leaves(n.a), ...leaves(n.b)]);

describe('layout tree', () => {
  it('starts with palette, picker, role pairs and samples', () => {
    expect(leaves(defaultDesktop()).map((l) => l.type === 'leaf' && l.panel)).toEqual(['palette', 'picker', 'pairs', 'samples']);
  });

  it('splits and removes panes', () => {
    const t0 = defaultDesktop();
    let t = t0;
    const picker = leaves(t)[1];
    t = splitLeaf(t, picker.id, 'col', 'matrix');
    expect(countLeaves(t)).toBe(5);
    const added = leaves(t)[2];
    expect(added.type === 'leaf' && added.panel).toBe('matrix');
    t = removeLeaf(t, added.id);
    expect(countLeaves(t)).toBe(4);
    // Removing the new pane restores the original panes.
    expect(leaves(t).map((l) => l.id)).toEqual(leaves(t0).map((l) => l.id));
  });

  it('never removes the last pane and caps the pane count', () => {
    const single: LayoutNode = { type: 'leaf', id: 'x', panel: 'picker' };
    expect(removeLeaf(single, 'x')).toBe(single);
    let t = defaultDesktop();
    for (let i = 0; i < 20; i++) t = splitLeaf(t, leaves(t)[0].id, 'row', 'tools');
    expect(countLeaves(t)).toBe(MAX_LEAVES);
  });

  it('changes a pane and clamps ratios', () => {
    let t = defaultDesktop();
    t = setPanel(t, leaves(t)[0].id, 'export');
    const first = leaves(t)[0];
    expect(first.type === 'leaf' && first.panel).toBe('export');
    t = setRatio(t, t.id, 0);
    expect(t.type === 'split' && t.ratio).toBe(MIN_RATIO);
  });

  it('suggests a panel that is not on screen yet', () => {
    expect(['matrix', 'compare', 'distinct', 'tools', 'export']).toContain(suggestPanel(defaultDesktop()));
  });
});
