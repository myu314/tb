import { decodeShare } from './io';
import { presetTheme } from './presets';
import { deriveBase24, newId, type Lang, type Palette, type Slot, type Theme } from './scheme';

const STORAGE_KEY = 'theme-bench:v1';
const HISTORY_LIMIT = 200;

interface Persisted {
  themes: Theme[];
  currentId: string;
  lang: Lang;
}

function load(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Persisted;
    if (!Array.isArray(data.themes) || data.themes.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

class AppState {
  themes = $state<Theme[]>([]);
  currentId = $state('');
  selected = $state<Slot>('base00');
  lang = $state<Lang>('ja');

  // Undo history per theme id; snapshots are whole themes.
  #past = $state<Record<string, Theme[]>>({});
  #future = $state<Record<string, Theme[]>>({});
  /** Snapshot taken at the start of a transient edit (e.g. a drag). */
  #pending: Theme | null = null;

  constructor() {
    const saved = load();
    if (saved) {
      this.themes = saved.themes;
      this.currentId = saved.themes.some((t) => t.id === saved.currentId) ? saved.currentId : saved.themes[0].id;
      this.lang = saved.lang ?? 'ja';
    } else {
      const t = presetTheme(0);
      this.themes = [t];
      this.currentId = t.id;
      this.lang = navigator.language?.startsWith('ja') ? 'ja' : 'en';
    }
    this.importFromHash();
  }

  get theme(): Theme {
    return this.themes.find((t) => t.id === this.currentId) ?? this.themes[0];
  }

  get canUndo() { return (this.#past[this.currentId]?.length ?? 0) > 0; }
  get canRedo() { return (this.#future[this.currentId]?.length ?? 0) > 0; }

  save() {
    try {
      const data: Persisted = { themes: this.themes, currentId: this.currentId, lang: this.lang };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage may be unavailable (private mode); the app still works in memory.
    }
  }

  #pushHistory(snapshot: Theme) {
    const id = snapshot.id;
    const past = this.#past[id] ?? [];
    this.#past[id] = [...past.slice(-HISTORY_LIMIT + 1), snapshot];
    this.#future[id] = [];
  }

  /**
   * Modify the current theme. With `transient`, history is recorded only once
   * `commit()` is called (used while dragging in the picker).
   */
  edit(fn: (t: Theme) => void, opts: { transient?: boolean } = {}) {
    const t = this.theme;
    if (opts.transient) {
      if (!this.#pending) this.#pending = clone(t);
    } else if (this.#pending) {
      this.commit();
      this.#pushHistory(clone(t));
    } else {
      this.#pushHistory(clone(t));
    }
    fn(t);
    t.updatedAt = Date.now();
    if (!opts.transient) this.save();
  }

  setColors(colors: Partial<Palette>, opts: { transient?: boolean } = {}) {
    this.edit((t) => Object.assign(t.palette, colors), opts);
  }

  commit() {
    if (!this.#pending) return;
    const snap = this.#pending;
    this.#pending = null;
    if (JSON.stringify(snap.palette) !== JSON.stringify(this.theme.palette)) this.#pushHistory(snap);
    this.save();
  }

  #restore(from: Record<string, Theme[]>, to: Record<string, Theme[]>) {
    this.commit();
    const id = this.currentId;
    const stack = from[id] ?? [];
    if (!stack.length) return;
    const snap = stack[stack.length - 1];
    from[id] = stack.slice(0, -1);
    to[id] = [...(to[id] ?? []), clone(this.theme)];
    const idx = this.themes.findIndex((t) => t.id === id);
    this.themes[idx] = snap;
    this.save();
  }

  undo() { this.#restore(this.#past, this.#future); }
  redo() { this.#restore(this.#future, this.#past); }

  // ---------- theme list ----------

  addTheme(t: Theme) {
    this.commit();
    this.themes.push(t);
    this.currentId = t.id;
    this.save();
  }

  select(id: string) {
    this.commit();
    this.currentId = id;
    this.save();
  }

  duplicate() {
    const t = clone(this.theme);
    t.id = newId();
    t.name += ' (copy)';
    t.slug = undefined;
    t.updatedAt = Date.now();
    this.addTheme(t);
  }

  remove(id: string) {
    if (this.themes.length <= 1) return;
    this.themes = this.themes.filter((t) => t.id !== id);
    delete this.#past[id];
    delete this.#future[id];
    if (this.currentId === id) this.currentId = this.themes[0].id;
    this.save();
  }

  /** Re-derive the base24 extras from the current base16 colors. */
  rederiveBase24() {
    this.setColors(deriveBase24(this.theme.palette, this.theme.variant));
  }

  importFromHash() {
    const m = location.hash.match(/^#t=([A-Za-z0-9_-]+)/);
    if (!m) return;
    try {
      this.addTheme(decodeShare(m[1]));
    } catch (e) {
      console.warn('Could not import shared theme', e);
    }
    history.replaceState(null, '', location.pathname + location.search);
  }
}

export const app = new AppState();
