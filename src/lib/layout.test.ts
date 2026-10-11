import { describe, expect, it } from 'vitest';
import {
  addTab, closeTab, countLeaves, defaultDesktop, MAX_LEAVES, MIN_RATIO, parseMobile, parseNode, removeLeaf,
  selectTab, setRatio, splitLeaf, suggestPanel, updateTabs, type LayoutNode, type PanelKind,
} from './layout.svelte';

type Leaf = Extract<LayoutNode, { type: 'leaf' }>;
const leaves = (n: LayoutNode): Leaf[] => (n.type === 'leaf' ? [n] : [...leaves(n.a), ...leaves(n.b)]);

describe('layout tree', () => {
  it('starts with palette, picker, contrast tools and samples', () => {
    expect(leaves(defaultDesktop()).map((l) => l.tabs[l.active])).toEqual(['palette', 'picker', 'pairs', 'samples']);
  });

  it('splits and removes panes', () => {
    const t0 = defaultDesktop();
    let t = splitLeaf(t0, leaves(t0)[1].id, 'col', 'matrix');
    expect(countLeaves(t)).toBe(5);
    const added = leaves(t)[2];
    expect(added.tabs).toEqual(['matrix']);
    t = removeLeaf(t, added.id);
    // Removing the new pane restores the original panes.
    expect(leaves(t).map((l) => l.id)).toEqual(leaves(t0).map((l) => l.id));
  });

  it('never removes the last pane and caps the pane count', () => {
    const single: LayoutNode = { type: 'leaf', id: 'x', tabs: ['picker'], active: 0 };
    expect(removeLeaf(single, 'x')).toBe(single);
    let t = defaultDesktop();
    for (let i = 0; i < 20; i++) t = splitLeaf(t, leaves(t)[0].id, 'row', 'tools');
    expect(countLeaves(t)).toBe(MAX_LEAVES);
  });

  it('clamps ratios', () => {
    const d = defaultDesktop();
    const t = setRatio(d, d.id, 0);
    expect(t.type === 'split' && t.ratio).toBe(MIN_RATIO);
  });

  it('suggests a panel that is not on screen yet', () => {
    const one: LayoutNode = { type: 'leaf', id: 'x', tabs: ['picker', 'palette'], active: 0 };
    expect(suggestPanel(one)).toBe('samples');
  });
});

describe('tabs', () => {
  const tabs = { tabs: ['picker', 'pairs', 'matrix'] as PanelKind[], active: 1 };

  it('adds a new tab and focuses it, or focuses an existing one', () => {
    expect(addTab(tabs, 'samples')).toEqual({ tabs: ['picker', 'pairs', 'matrix', 'samples'], active: 3 });
    expect(addTab(tabs, 'picker')).toEqual({ tabs: ['picker', 'pairs', 'matrix'], active: 0 });
  });

  it('closes tabs and keeps a sensible focus', () => {
    expect(closeTab(tabs, 0)).toEqual({ tabs: ['pairs', 'matrix'], active: 0 }); // focus stays on pairs
    expect(closeTab(tabs, 1)).toEqual({ tabs: ['picker', 'matrix'], active: 1 }); // neighbour takes over
    expect(closeTab(tabs, 2)).toEqual({ tabs: ['picker', 'pairs'], active: 1 });
    expect(closeTab({ tabs: ['picker'], active: 0 }, 0)).toBeNull();
  });

  it('selects only valid tabs', () => {
    expect(selectTab(tabs, 2).active).toBe(2);
    expect(selectTab(tabs, 9).active).toBe(1);
  });

  it('updates the tabs of one pane in the tree', () => {
    const d = defaultDesktop();
    const id = leaves(d)[1].id;
    const next = updateTabs(d, id, (x) => addTab(x, 'compare'));
    expect(leaves(next)[1].tabs).toEqual(['picker', 'compare']);
    expect(leaves(next)[0]).toEqual(leaves(d)[0]);
  });
});

describe('stored layouts', () => {
  it('migrates the single-panel format', () => {
    const old = {
      type: 'split', id: 's', dir: 'row', ratio: 0.3,
      a: { type: 'leaf', id: 'a', panel: 'palette' }, b: { type: 'leaf', id: 'b', panel: 'picker' },
    };
    expect(leaves(parseNode(old)!).map((l) => l.tabs)).toEqual([['palette'], ['picker']]);
    expect(parseMobile({ top: 'samples', bottom: 'picker', ratio: 0.4 })).toEqual({
      top: { tabs: ['samples'], active: 0 }, bottom: { tabs: ['picker'], active: 0 }, ratio: 0.4,
    });
  });

  it('drops unknown or duplicate panels and rejects broken trees', () => {
    const n = parseNode({ type: 'leaf', id: 'a', tabs: ['picker', 'nope', 'picker'], active: 5 })!;
    expect(n).toEqual({ type: 'leaf', id: 'a', tabs: ['picker'], active: 0 });
    expect(parseNode({ type: 'leaf', id: 'a', tabs: [] })).toBeNull();
    expect(parseNode({ type: 'split', id: 's', dir: 'row', ratio: 2, a: n, b: n })).toBeNull();
  });
});
