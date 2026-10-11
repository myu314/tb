// Panel layout: a binary split tree on desktop, two stacked panes on phones.
// Every pane holds one or more tabs, each showing a panel.

export const PANEL_KINDS = [
  'picker', 'palette', 'samples', 'pairs', 'matrix', 'compare', 'distinct', 'tools', 'export',
] as const;
export type PanelKind = (typeof PANEL_KINDS)[number];

export interface Tabs { tabs: PanelKind[]; active: number }

export type Dir = 'row' | 'col'; // row: side by side, col: stacked
export type LayoutNode =
  | ({ type: 'leaf'; id: string } & Tabs)
  | { type: 'split'; id: string; dir: Dir; ratio: number; a: LayoutNode; b: LayoutNode };

export interface MobileLayout { top: Tabs; bottom: Tabs; ratio: number }

export const MIN_RATIO = 0.08;
export const MAX_LEAVES = 8;

const uid = () => Math.random().toString(36).slice(2, 9);
const leaf = (...tabs: PanelKind[]): LayoutNode => ({ type: 'leaf', id: uid(), tabs, active: 0 });
const split = (dir: Dir, ratio: number, a: LayoutNode, b: LayoutNode): LayoutNode =>
  ({ type: 'split', id: uid(), dir, ratio, a, b });

/** Palette | picker over contrast tools | samples. */
export function defaultDesktop(): LayoutNode {
  return split(
    'row', 0.2,
    leaf('palette', 'tools', 'export'),
    split('row', 0.42, split('col', 0.66, leaf('picker'), leaf('pairs', 'compare', 'distinct', 'matrix')), leaf('samples')),
  );
}
export const defaultMobile = (): MobileLayout => ({
  top: { tabs: ['samples', 'pairs', 'distinct'], active: 0 },
  bottom: { tabs: ['picker', 'palette', 'tools', 'export'], active: 0 },
  ratio: 0.38,
});

const clampRatio = (r: number) => Math.min(1 - MIN_RATIO, Math.max(MIN_RATIO, r));
const isKind = (k: unknown): k is PanelKind => (PANEL_KINDS as readonly unknown[]).includes(k);

// ---------- validation and migration (stored layouts may be stale or hand-edited) ----------

/** Accepts the current { tabs, active } shape and the older single-panel shape. */
function toTabs(x: unknown): Tabs | null {
  if (isKind(x)) return { tabs: [x], active: 0 };
  const t = x as Partial<Tabs> & { panel?: unknown };
  if (t && isKind(t.panel)) return { tabs: [t.panel], active: 0 };
  if (!t || !Array.isArray(t.tabs)) return null;
  const tabs = [...new Set(t.tabs.filter(isKind))];
  if (!tabs.length) return null;
  const active = Number.isInteger(t.active) ? Math.min(Math.max(t.active!, 0), tabs.length - 1) : 0;
  return { tabs, active };
}

export function parseNode(n: unknown, depth = 0): LayoutNode | null {
  const x = n as Record<string, unknown>;
  if (!x || typeof x !== 'object' || typeof x.id !== 'string' || depth > 12) return null;
  if (x.type === 'leaf') {
    const t = toTabs(x);
    return t ? { type: 'leaf', id: x.id, ...t } : null;
  }
  if (x.type !== 'split' || (x.dir !== 'row' && x.dir !== 'col')) return null;
  if (typeof x.ratio !== 'number' || !(x.ratio > 0 && x.ratio < 1)) return null;
  const a = parseNode(x.a, depth + 1);
  const b = parseNode(x.b, depth + 1);
  return a && b ? { type: 'split', id: x.id, dir: x.dir, ratio: x.ratio, a, b } : null;
}

export function parseMobile(m: unknown): MobileLayout | null {
  const x = m as Record<string, unknown>;
  if (!x || typeof x.ratio !== 'number' || !(x.ratio > 0 && x.ratio < 1)) return null;
  const top = toTabs(x.top);
  const bottom = toTabs(x.bottom);
  return top && bottom ? { top, bottom, ratio: x.ratio } : null;
}

// ---------- pure operations (exported for tests) ----------

export function countLeaves(n: LayoutNode): number {
  return n.type === 'leaf' ? 1 : countLeaves(n.a) + countLeaves(n.b);
}

function mapNode(n: LayoutNode, id: string, fn: (n: LayoutNode) => LayoutNode): LayoutNode {
  if (n.id === id) return fn(n);
  if (n.type === 'leaf') return n;
  return { ...n, a: mapNode(n.a, id, fn), b: mapNode(n.b, id, fn) };
}

/** Add a panel as a tab (or focus it if the pane already has it). */
export function addTab(t: Tabs, kind: PanelKind): Tabs {
  const i = t.tabs.indexOf(kind);
  return i >= 0 ? { ...t, active: i } : { tabs: [...t.tabs, kind], active: t.tabs.length };
}

/** Remove a tab; returns null when it was the last one. */
export function closeTab(t: Tabs, index: number): Tabs | null {
  if (t.tabs.length <= 1) return null;
  const tabs = t.tabs.filter((_, i) => i !== index);
  // Keep the same tab focused, or the neighbour of the one that was closed.
  const active = index < t.active ? t.active - 1 : Math.min(t.active, tabs.length - 1);
  return { tabs, active };
}

export const selectTab = (t: Tabs, index: number): Tabs =>
  index >= 0 && index < t.tabs.length ? { ...t, active: index } : t;

/** Split a leaf in two; the new pane goes after it and shows `panel`. */
export function splitLeaf(root: LayoutNode, id: string, dir: Dir, panel: PanelKind): LayoutNode {
  if (countLeaves(root) >= MAX_LEAVES) return root;
  return mapNode(root, id, (n) => split(dir, 0.5, n, leaf(panel)));
}

/** Remove a leaf; its sibling takes the parent's place. The last pane can't be removed. */
export function removeLeaf(root: LayoutNode, id: string): LayoutNode {
  if (root.type === 'leaf') return root;
  if (root.a.id === id) return root.b;
  if (root.b.id === id) return root.a;
  return { ...root, a: removeLeaf(root.a, id), b: removeLeaf(root.b, id) };
}

export const updateTabs = (root: LayoutNode, id: string, fn: (t: Tabs) => Tabs) =>
  mapNode(root, id, (n) => (n.type === 'leaf' ? { ...n, ...fn(n) } : n));

export const setRatio = (root: LayoutNode, id: string, ratio: number) =>
  mapNode(root, id, (n) => (n.type === 'split' ? { ...n, ratio: clampRatio(ratio) } : n));

/** A panel that isn't on screen yet, so a new split shows something useful. */
export function suggestPanel(root: LayoutNode): PanelKind {
  const used = new Set<PanelKind>();
  const walk = (n: LayoutNode): void => {
    if (n.type === 'leaf') n.tabs.forEach((k) => used.add(k));
    else { walk(n.a); walk(n.b); }
  };
  walk(root);
  return PANEL_KINDS.find((k) => !used.has(k)) ?? 'samples';
}

// ---------- reactive store ----------

const KEY = 'theme-bench:layout:v1';

class LayoutState {
  desktop = $state<LayoutNode>(defaultDesktop());
  mobile = $state<MobileLayout>(defaultMobile());
  /** When locked, the arrangement can't change; switching tabs still works. */
  locked = $state(false);

  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      this.desktop = parseNode(saved?.desktop) ?? this.desktop;
      this.mobile = parseMobile(saved?.mobile) ?? this.mobile;
      this.locked = saved?.locked === true;
    } catch {}
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ desktop: this.desktop, mobile: this.mobile, locked: this.locked }));
    } catch {}
  }

  #edit(fn: () => void) {
    if (this.locked) return;
    fn();
    this.save();
  }

  toggleLock() { this.locked = !this.locked; this.save(); }

  // desktop
  selectTab(id: string, i: number) { this.desktop = updateTabs(this.desktop, id, (t) => selectTab(t, i)); this.save(); }
  addTab(id: string, kind: PanelKind) { this.#edit(() => (this.desktop = updateTabs(this.desktop, id, (t) => addTab(t, kind)))); }
  closeTab(id: string, i: number) {
    this.#edit(() => {
      let last = false;
      const next = updateTabs(this.desktop, id, (t) => closeTab(t, i) ?? ((last = true), t));
      // Closing the last tab closes the pane (unless it's the only one).
      this.desktop = last ? removeLeaf(this.desktop, id) : next;
    });
  }
  split(id: string, dir: Dir) { this.#edit(() => (this.desktop = splitLeaf(this.desktop, id, dir, suggestPanel(this.desktop)))); }
  remove(id: string) { this.#edit(() => (this.desktop = removeLeaf(this.desktop, id))); }
  /** Live while dragging; call save() when the drag ends. */
  setRatio(id: string, ratio: number) { if (!this.locked) this.desktop = setRatio(this.desktop, id, ratio); }
  get canSplit() { return countLeaves(this.desktop) < MAX_LEAVES; }
  get leafCount() { return countLeaves(this.desktop); }

  // phone
  setMobileRatio(ratio: number) { if (!this.locked) this.mobile.ratio = Math.min(0.85, Math.max(0.12, ratio)); }
  selectMobileTab(which: 'top' | 'bottom', i: number) { this.mobile[which] = selectTab(this.mobile[which], i); this.save(); }
  addMobileTab(which: 'top' | 'bottom', kind: PanelKind) { this.#edit(() => (this.mobile[which] = addTab(this.mobile[which], kind))); }
  closeMobileTab(which: 'top' | 'bottom', i: number) {
    this.#edit(() => (this.mobile[which] = closeTab(this.mobile[which], i) ?? this.mobile[which]));
  }

  reset() {
    this.desktop = defaultDesktop();
    this.mobile = defaultMobile();
    this.save();
  }
}

export const layout = new LayoutState();
