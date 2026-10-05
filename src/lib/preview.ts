import { hexToOklch } from './color';
import { effectivePalette, type Theme } from './scheme';

/** Inline style that feeds a theme into the preview utility classes (.pv .f-XX / .b-XX). */
export function previewVars(t: Theme): string {
  const pal = effectivePalette(t);
  return (
    Object.entries(pal).map(([k, v]) => `--${k}: ${v}`).join('; ') +
    `; --hl-ring: ${hexToOklch(pal.base00).l > 0.6 ? '#000' : '#fff'}`
  );
}
