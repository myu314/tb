import { apcaContrast, wcagContrast } from './color';
import { ACCENT_SLOTS, BRIGHT_SLOTS, type Lang, type Palette, type Slot, type System } from './scheme';

export type PairKind = 'text' | 'subtle';

export interface RolePair {
  fg: Slot;
  bg: Slot;
  label: Record<Lang, string>;
  kind: PairKind;
}

/** Thresholds by kind: text should be readable as body copy, subtle (comments etc.) less so. */
export const THRESHOLDS: Record<PairKind, { wcag: number; apca: number }> = {
  text: { wcag: 4.5, apca: 60 },
  subtle: { wcag: 3, apca: 45 },
};

export function rolePairs(system: System): RolePair[] {
  const pairs: RolePair[] = [
    { fg: 'base05', bg: 'base00', kind: 'text', label: { ja: '本文', en: 'Body text' } },
    { fg: 'base04', bg: 'base01', kind: 'text', label: { ja: 'ステータスバー', en: 'Status bar' } },
    { fg: 'base05', bg: 'base01', kind: 'text', label: { ja: 'パネル上の本文', en: 'Text on panel' } },
    { fg: 'base05', bg: 'base02', kind: 'text', label: { ja: '選択範囲の文字', en: 'Selected text' } },
    { fg: 'base04', bg: 'base00', kind: 'subtle', label: { ja: '補助テキスト', en: 'Secondary text' } },
    { fg: 'base03', bg: 'base00', kind: 'subtle', label: { ja: 'コメント', en: 'Comments' } },
    { fg: 'base03', bg: 'base01', kind: 'subtle', label: { ja: '行番号', en: 'Line numbers' } },
    { fg: 'base06', bg: 'base00', kind: 'text', label: { ja: '強調前景', en: 'Light fg' } },
  ];
  for (const s of ACCENT_SLOTS) {
    pairs.push({ fg: s, bg: 'base00', kind: 'text', label: { ja: 'コード要素', en: 'Syntax token' } });
  }
  for (const s of ACCENT_SLOTS) {
    pairs.push({ fg: s, bg: 'base02', kind: 'subtle', label: { ja: '選択中のコード要素', en: 'Token in selection' } });
  }
  pairs.push(
    { fg: 'base00', bg: 'base0A', kind: 'text', label: { ja: '検索ヒット', en: 'Search match' } },
    { fg: 'base00', bg: 'base0D', kind: 'text', label: { ja: 'アクティブ見出し・バッジ', en: 'Active badge' } },
  );
  if (system === 'base24') {
    for (const s of BRIGHT_SLOTS) {
      pairs.push({ fg: s, bg: 'base00', kind: 'text', label: { ja: 'ターミナル明色', en: 'Bright ANSI' } });
    }
    pairs.push(
      { fg: 'base05', bg: 'base10', kind: 'text', label: { ja: 'サイドバー', en: 'Sidebar' } },
      { fg: 'base05', bg: 'base11', kind: 'text', label: { ja: '最奥の背景', en: 'Darkest bg' } },
    );
  }
  return pairs;
}

export interface PairResult { wcag: number; apca: number; passWcag: boolean; passApca: boolean; }

export function evaluate(p: Palette, fg: Slot, bg: Slot, kind: PairKind): PairResult {
  const wcag = wcagContrast(p[fg], p[bg]);
  const apca = apcaContrast(p[fg], p[bg]);
  const th = THRESHOLDS[kind];
  return { wcag, apca, passWcag: wcag >= th.wcag, passApca: Math.abs(apca) >= th.apca };
}

const BG_SLOTS: Slot[] = ['base00', 'base01', 'base02', 'base07', 'base10', 'base11'];

/** Pairs to show next to the picker for the slot being edited. */
export function livePairs(slot: Slot, system: System): { fg: Slot; bg: Slot; kind: PairKind }[] {
  const all = rolePairs(system).filter((p) => p.fg === slot || p.bg === slot);
  if (all.length) return all.slice(0, 6);
  // Slots without a defined pair: compare against the main background / foreground.
  return BG_SLOTS.includes(slot)
    ? [{ fg: 'base05', bg: slot, kind: 'text' }]
    : [{ fg: slot, bg: 'base00', kind: 'text' }];
}
