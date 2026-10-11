// Panel layout: a binary split tree on desktop, two stacked panes on phones.

export const PANEL_KINDS = [
  'picker', 'palette', 'samples', 'pairs', 'matrix', 'compare', 'distinct', 'tools', 'export',
] as const;
export type PanelKind = (typeof PANEL_KINDS)[number];

export type Dir = 'row' | 'col'; // row: side by side, col: stacked
export type LayoutNode =
  | { type: 'leaf'; id: string; panel: PanelKind }
  | { type: 'split'; id: string; dir: Dir; ratio: number; a: LayoutNode; b: LayoutNode };

export interface MobileLayout { top: PanelKind; bottom: PanelKind; ratio: number }

export const MIN_RATIO = 0.08;
export const MAX_LEAVES = 8;

const uid = () => Math.random().toString(36).slice(2, 9);
const leaf = (panel: PanelKind): LayoutNode => ({ type: 'leaf', id: uid(), panel });
const split = (dir: Dir, ratio: number, a: LayoutNode, b: LayoutNode): LayoutNode =>
  ({ type: 'split', id: uid(), dir, ratio, a, b });

/** Palette | picker over role pairs | samples. */
export function defaultDesktop(): LayoutNode {
  return split('row', 0.2, leaf('palette'), split('row', 0.42, split('col', 0.66, leaf('picker'), leaf('pairs')), leaf('samples')));
}
export const defaultMobile = (): MobileLayout => ({ top: 'samples', bottom: 'picker', ratio: 0.38 });

const clampRatio = (r: number) => Math.min(1 - MIN_RATIO, Math.max(MIN_RATIO, r));

// ---------- validation (stored layouts may be stale or hand-edited) ----------

function isNode(n: unknown, depth = 0): n is LayoutNode {
  const x = n as LayoutNode;
  if (!x || typeof x !== 'object' || typeof x.id !== 'string' || depth > 12) return false;
  if (x.type === 'leaf') return (PANEL_KINDS as readonly string[]).includes(x.panel);
  return (
    x.type === 'split' && (x.dir === 'row' || x.dir === 'col') &&
    typeof x.ratio === 'number' && x.ratio > 0 && x.ratio < 1 &&
    isNode(x.a, depth + 1) && isNode(x.b, depth + 1)
  );
}
const isMobile = (m: unknown): m is MobileLayout => {
  const x = m as MobileLayout;
  return !!x && (PANEL_KINDS as readonly string[]).includes(x.top) &&
    (PANEL_KINDS as readonly string[]).includes(x.bottom) &&
    typeof x.ratio === 'number' && x.ratio > 0 && x.ratio < 1;
};

// ---------- pure tree operations (exported for tests) ----------

export function countLeaves(n: LayoutNode): number {
  return n.type === 'leaf' ? 1 : countLeaves(n.a) + countLeaves(n.b);
}

function mapNode(n: LayoutNode, id: string, fn: (n: LayoutNode) => LayoutNode): LayoutNode {
  if (n.id === id) return fn(n);
  if (n.type === 'leaf') return n;
  return { ...n, a: mapNode(n.a, id, fn), b: mapNode(n.b, id, fn) };
}

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

export const setPanel = (root: LayoutNode, id: string, panel: PanelKind) =>
  mapNode(root, id, (n) => (n.type === 'leaf' ? { ...n, panel } : n));

export const setRatio = (root: LayoutNode, id: string, ratio: number) =>
  mapNode(root, id, (n) => (n.type === 'split' ? { ...n, ratio: clampRatio(ratio) } : n));

/** A panel that isn't on screen yet, so a new split shows something useful. */
export function suggestPanel(root: LayoutNode): PanelKind {
  const used = new Set<PanelKind>();
  const walk = (n: LayoutNode): void => {
    if (n.type === 'leaf') used.add(n.panel);
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

  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      if (isNode(saved?.desktop)) this.desktop = saved.desktop;
      if (isMobile(saved?.mobile)) this.mobile = saved.mobile;
    } catch {}
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ desktop: this.desktop, mobile: this.mobile }));
    } catch {}
  }

  setPanel(id: string, panel: PanelKind) { this.desktop = setPanel(this.desktop, id, panel); this.save(); }
  split(id: string, dir: Dir) { this.desktop = splitLeaf(this.desktop, id, dir, suggestPanel(this.desktop)); this.save(); }
  remove(id: string) { this.desktop = removeLeaf(this.desktop, id); this.save(); }
  /** Live while dragging; call save() when the drag ends. */
  setRatio(id: string, ratio: number) { this.desktop = setRatio(this.desktop, id, ratio); }
  setMobileRatio(ratio: number) { this.mobile.ratio = Math.min(0.85, Math.max(0.12, ratio)); }
  setMobilePanel(which: 'top' | 'bottom', panel: PanelKind) { this.mobile[which] = panel; this.save(); }
  get canSplit() { return countLeaves(this.desktop) < MAX_LEAVES; }
  get leafCount() { return countLeaves(this.desktop); }

  reset() {
    this.desktop = defaultDesktop();
    this.mobile = defaultMobile();
    this.save();
  }
}

export const layout = new LayoutState();
