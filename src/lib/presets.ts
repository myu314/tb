import { deriveBase24, newId, BASE16_SLOTS, type Palette, type System, type Theme, type Variant } from './scheme';

interface Preset { name: string; author: string; variant: Variant; system: System; colors: string; }

// Colors listed in slot order (base00..base0F, then base10..base17 for base24).
const PRESETS: Preset[] = [
  {
    name: 'Tomorrow Night', author: 'Chris Kempson', variant: 'dark', system: 'base16',
    colors: '1d1f21 282a2e 373b41 969896 b4b7b4 c5c8c6 e0e0e0 ffffff cc6666 de935f f0c674 b5bd68 8abeb7 81a2be b294bb a3685a',
  },
  {
    name: 'Default Dark', author: 'Chris Kempson', variant: 'dark', system: 'base16',
    colors: '181818 282828 383838 585858 b8b8b8 d8d8d8 e8e8e8 f8f8f8 ab4642 dc9656 f7ca88 a1b56c 86c1b9 7cafc2 ba8baf a16946',
  },
  {
    name: 'Gruvbox dark, medium', author: 'Dawid Kurek, morhetz', variant: 'dark', system: 'base16',
    colors: '282828 3c3836 504945 665c54 bdae93 d5c4a1 ebdbb2 fbf1c7 fb4934 fe8019 fabd2f b8bb26 8ec07c 83a598 d3869b d65d0e',
  },
  {
    name: 'Nord', author: 'arcticicestudio', variant: 'dark', system: 'base16',
    colors: '2e3440 3b4252 434c5e 4c566a d8dee9 e5e9f0 eceff4 8fbcbb bf616a d08770 ebcb8b a3be8c 88c0d0 81a1c1 b48ead 5e81ac',
  },
  {
    name: 'Catppuccin Mocha', author: 'Catppuccin', variant: 'dark', system: 'base16',
    colors: '1e1e2e 181825 313244 45475a 585b70 cdd6f4 f5e0dc b4befe f38ba8 fab387 f9e2af a6e3a1 94e2d5 89b4fa cba6f7 f2cdcd',
  },
  {
    name: 'Solarized Light', author: 'Ethan Schoonover', variant: 'light', system: 'base16',
    colors: 'fdf6e3 eee8d5 93a1a1 839496 657b83 586e75 073642 002b36 dc322f cb4b16 b58900 859900 2aa198 268bd2 6c71c4 d33682',
  },
  {
    name: 'Tomorrow', author: 'Chris Kempson', variant: 'light', system: 'base16',
    colors: 'ffffff e0e0e0 d6d6d6 8e908c 969896 4d4d4c 282a2e 1d1f21 c82829 f5871f eab700 718c00 3e999f 4271ae 8959a8 a3685a',
  },
  {
    name: 'Dracula', author: 'Zeno Rocha (base24 adaptation)', variant: 'dark', system: 'base24',
    colors:
      '282a36 363447 44475a 6272a4 9ea8c7 f8f8f2 f0f1f4 ffffff ff5555 ffb86c f1fa8c 50fa7b 8be9fd 80bfff ff79c6 bd93f9 ' +
      '1e2029 16171d ff6e6e ffffa5 69ff94 a4ffff d6acff ff92df',
  },
];

export const presetNames = PRESETS.map((p) => p.name);

export function presetTheme(index: number): Theme {
  const p = PRESETS[index];
  const hex = p.colors.trim().split(/\s+/).map((c) => '#' + c);
  const palette = {} as Palette;
  BASE16_SLOTS.forEach((s, i) => (palette[s] = hex[i]));
  if (p.system === 'base24') {
    (['base10', 'base11', 'base12', 'base13', 'base14', 'base15', 'base16', 'base17'] as const).forEach(
      (s, i) => (palette[s] = hex[16 + i]),
    );
  } else {
    Object.assign(palette, deriveBase24(palette, p.variant));
  }
  return {
    id: newId(),
    name: p.name,
    author: p.author,
    system: p.system,
    variant: p.variant,
    palette,
    updatedAt: Date.now(),
  };
}
