<script lang="ts">
  import { untrack } from 'svelte';
  import {
    clamp,
    gamutMapOklch,
    hexToHsv,
    hexToOklch,
    hexToRgb,
    hsvToHex,
    hsvToRgb,
    inGamut,
    normalizeHex,
    oklchInGamut,
    oklchToHex,
    oklchToRgbRaw,
    rgbToHex,
    type HSV,
    type OKLCH,
    type RGB,
  } from '../lib/color';
  import { livePairs } from '../lib/contrast';
  import { t } from '../lib/i18n';
  import { ROLES } from '../lib/scheme';
  import { app } from '../lib/state.svelte';
  import PairRow from './PairRow.svelte';
  import Slider from './Slider.svelte';

  type Mode = 'rgb' | 'hsv' | 'oklch';
  const MAX_C = 0.37;

  const savedMode = (() => { try { return localStorage.getItem('theme-bench:mode') as Mode | null; } catch { return null; } })();
  let mode = $state<Mode>(savedMode ?? 'oklch');
  $effect(() => {
    try { localStorage.setItem('theme-bench:mode', mode); } catch {}
  });

  const hex = $derived(app.theme.palette[app.selected]);
  let hsv = $state<HSV>({ h: 0, s: 0, v: 0 });
  let lch = $state<OKLCH>({ l: 0, c: 0, h: 0 });
  let rgb = $state<RGB>({ r: 0, g: 0, b: 0 });
  // Hex we last emitted, so our own edits don't reset the hue of grays etc.
  let emitted = '';

  function syncFrom(h: string, keepHue: boolean) {
    rgb = hexToRgb(h);
    const nh = hexToHsv(h);
    hsv = keepHue && nh.s < 0.01 ? { ...nh, h: hsv.h } : nh;
    const nl = hexToOklch(h);
    lch = keepHue && nl.c < 0.003 ? { ...nl, h: lch.h } : nl;
  }

  $effect.pre(() => {
    const h = hex;
    app.selected;
    untrack(() => {
      if (h !== emitted) syncFrom(h, false);
      emitted = h;
    });
  });

  function emit(newHex: string, transient: boolean) {
    emitted = newHex;
    if (newHex !== hex) app.setColors({ [app.selected]: newHex }, { transient });
  }

  function setHsv(next: Partial<HSV>, transient = true) {
    hsv = { ...hsv, ...next };
    const h = hsvToHex(hsv);
    rgb = hexToRgb(h);
    const nl = hexToOklch(h);
    lch = nl.c < 0.003 ? { ...nl, h: lch.h } : nl;
    emit(h, transient);
  }

  function setLch(next: Partial<OKLCH>, transient = true) {
    lch = { ...lch, ...next };
    const h = oklchToHex(lch);
    rgb = hexToRgb(h);
    const nh = hexToHsv(h);
    hsv = nh.s < 0.01 ? { ...nh, h: hsv.h } : nh;
    emit(h, transient);
  }

  function setRgb(next: Partial<RGB>, transient = true) {
    rgb = { ...rgb, ...next };
    const h = rgbToHex(rgb);
    const nh = hexToHsv(h);
    hsv = nh.s < 0.01 ? { ...nh, h: hsv.h } : nh;
    const nl = hexToOklch(h);
    lch = nl.c < 0.003 ? { ...nl, h: lch.h } : nl;
    emit(h, transient);
  }

  function commit() {
    // Snap an out-of-gamut OKLCH position to the color that was actually stored.
    if (!oklchInGamut(lch)) lch = gamutMapOklch(lch);
    app.commit();
  }

  const outOfGamut = $derived(mode === 'oklch' && !oklchInGamut(lch));

  // ---------- gradients ----------

  const stops = (n: number, f: (t: number) => string) =>
    `linear-gradient(to right, ${Array.from({ length: n + 1 }, (_, i) => f(i / n)).join(', ')})`;

  const gr = $derived({
    r: stops(1, (x) => rgbToHex({ ...rgb, r: x })),
    g: stops(1, (x) => rgbToHex({ ...rgb, g: x })),
    b: stops(1, (x) => rgbToHex({ ...rgb, b: x })),
    hh: stops(12, (x) => hsvToHex({ h: x * 360, s: 1, v: 1 })),
    s: stops(6, (x) => hsvToHex({ ...hsv, s: x })),
    v: stops(6, (x) => hsvToHex({ ...hsv, v: x })),
    l: stops(10, (x) => oklchToHex({ ...lch, l: x })),
    c: stops(10, (x) => oklchToHex({ ...lch, c: x * MAX_C })),
    lh: stops(24, (x) => oklchToHex({ ...lch, h: x * 360 })),
  });

  // ---------- 2D plane ----------

  let canvas = $state<HTMLCanvasElement>();
  const RES = 128;
  // Only the hue changes what the plane looks like.
  const planeHue = $derived(mode === 'oklch' ? lch.h : hsv.h);

  $effect(() => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(RES, RES);
    const d = img.data;
    const h = planeHue;
    if (mode === 'oklch') {
      for (let y = 0; y < RES; y++) {
        const l = 1 - y / (RES - 1);
        for (let x = 0; x < RES; x++) {
          const c = (x / (RES - 1)) * MAX_C;
          let col = oklchToRgbRaw({ l, c, h });
          const ok = inGamut(col);
          if (!ok) col = oklchToRgbRaw(gamutMapOklch({ l, c, h }));
          let r = col.r, g = col.g, b = col.b;
          if (!ok) {
            // Hatch out-of-gamut area: dim the mapped color with diagonal stripes.
            const stripe = (x + y) % 8 < 4;
            const k = stripe ? 0.55 : 0.8;
            r = r * k + 0.5 * (1 - k);
            g = g * k + 0.5 * (1 - k);
            b = b * k + 0.5 * (1 - k);
          }
          const i = (y * RES + x) * 4;
          d[i] = r * 255; d[i + 1] = g * 255; d[i + 2] = b * 255; d[i + 3] = 255;
        }
      }
    } else {
      for (let y = 0; y < RES; y++) {
        const v = 1 - y / (RES - 1);
        for (let x = 0; x < RES; x++) {
          const c = hsvToRgb({ h, s: x / (RES - 1), v });
          const i = (y * RES + x) * 4;
          d[i] = c.r * 255; d[i + 1] = c.g * 255; d[i + 2] = c.b * 255; d[i + 3] = 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  });

  const cursor = $derived(
    mode === 'oklch'
      ? { x: clamp(lch.c / MAX_C, 0, 1), y: 1 - lch.l }
      : { x: hsv.s, y: 1 - hsv.v },
  );

  function planeAt(e: PointerEvent, transient: boolean) {
    const rect = canvas!.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
    if (mode === 'oklch') setLch({ c: x * MAX_C, l: 1 - y }, transient);
    else setHsv({ s: x, v: 1 - y }, transient);
  }

  let dragging = false;
  function down(e: PointerEvent) {
    dragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    planeAt(e, true);
  }
  function move(e: PointerEvent) {
    if (dragging) planeAt(e, true);
  }
  function up() {
    if (!dragging) return;
    dragging = false;
    commit();
  }
  function key(e: KeyboardEvent) {
    const step = e.shiftKey ? 0.05 : 0.01;
    const dx = e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0;
    const dy = e.key === 'ArrowUp' ? step : e.key === 'ArrowDown' ? -step : 0;
    if (!dx && !dy) return;
    e.preventDefault();
    if (mode === 'oklch') setLch({ c: clamp(lch.c + dx * MAX_C, 0, MAX_C), l: clamp(lch.l + dy, 0, 1) }, false);
    else setHsv({ s: clamp(hsv.s + dx, 0, 1), v: clamp(hsv.v + dy, 0, 1) }, false);
  }

  // ---------- text inputs ----------

  let hexDraft = $state('');
  $effect(() => { hexDraft = hex; });
  function onHex() {
    const n = normalizeHex(hexDraft);
    if (n) { syncFrom(n, true); emit(n, false); }
    else hexDraft = hex;
  }

  const fmt = $derived({
    rgb: `rgb(${Math.round(rgb.r * 255)} ${Math.round(rgb.g * 255)} ${Math.round(rgb.b * 255)})`,
    hsv: `hsv(${hsv.h.toFixed(0)} ${(hsv.s * 100).toFixed(0)}% ${(hsv.v * 100).toFixed(0)}%)`,
    oklch: (() => {
      const m = hexToOklch(hex);
      return `oklch(${(m.l * 100).toFixed(1)}% ${m.c.toFixed(3)} ${m.h.toFixed(1)})`;
    })(),
  });

  const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;
  async function eyedrop() {
    try {
      // @ts-expect-error EyeDropper is not in lib.dom yet
      const res = await new window.EyeDropper().open();
      const n = normalizeHex(res.sRGBHex);
      if (n) { syncFrom(n, false); emit(n, false); }
    } catch {}
  }

  const role = $derived(ROLES[app.selected]);
  const pairs = $derived(livePairs(app.selected, app.theme.system));
</script>

<section class="picker">
  <header>
    <div class="swatch" style:background={hex}></div>
    <div class="title">
      <div><strong class="mono">{app.selected}</strong> · {role.label[app.lang]}</div>
      <div class="muted small">{role.uses[app.lang]}</div>
    </div>
  </header>

  <div class="toolbar">
    <div class="seg" role="tablist">
      {#each ['rgb', 'hsv', 'oklch'] as const as m}
        <button class:on={mode === m} role="tab" aria-selected={mode === m} onclick={() => (mode = m)}>{m.toUpperCase()}</button>
      {/each}
    </div>
    <input class="hex mono" type="text" bind:value={hexDraft} onchange={onHex} spellcheck="false" autocomplete="off" aria-label="HEX" />
    {#if hasEyeDropper}
      <button onclick={eyedrop} title="Eyedropper" aria-label="Eyedropper">💧</button>
    {/if}
  </div>

  <div class="plane-wrap">
    <canvas
      bind:this={canvas}
      width={RES}
      height={RES}
      class="plane"
      tabindex="0"
      aria-label={mode === 'oklch' ? 'Chroma × Lightness' : 'Saturation × Value'}
      onpointerdown={down}
      onpointermove={move}
      onpointerup={up}
      onpointercancel={up}
      onkeydown={key}
      onkeyup={(e) => e.key.startsWith('Arrow') && app.commit()}
    ></canvas>
    <div class="cursor" style:left="{cursor.x * 100}%" style:top="{cursor.y * 100}%" style:background={hex}></div>
    <div class="axis x muted small">{mode === 'oklch' ? 'C →' : 'S →'}</div>
    <div class="axis y muted small">{mode === 'oklch' ? 'L →' : 'V →'}</div>
  </div>
  <div class="gamut small" class:show={outOfGamut}>⚠ {t('outOfGamut')}</div>

  <div class="sliders">
    {#if mode === 'rgb'}
      <Slider label="R" value={rgb.r * 255} min={0} max={255} step={1} gradient={gr.r} oninput={(v) => setRgb({ r: v / 255 })} onchange={commit} />
      <Slider label="G" value={rgb.g * 255} min={0} max={255} step={1} gradient={gr.g} oninput={(v) => setRgb({ g: v / 255 })} onchange={commit} />
      <Slider label="B" value={rgb.b * 255} min={0} max={255} step={1} gradient={gr.b} oninput={(v) => setRgb({ b: v / 255 })} onchange={commit} />
    {:else if mode === 'hsv'}
      <Slider label="H" value={hsv.h} min={0} max={360} step={1} gradient={gr.hh} oninput={(v) => setHsv({ h: v })} onchange={commit} />
      <Slider label="S" value={hsv.s * 100} min={0} max={100} step={1} gradient={gr.s} oninput={(v) => setHsv({ s: v / 100 })} onchange={commit} />
      <Slider label="V" value={hsv.v * 100} min={0} max={100} step={1} gradient={gr.v} oninput={(v) => setHsv({ v: v / 100 })} onchange={commit} />
    {:else}
      <Slider label="L" value={lch.l * 100} min={0} max={100} step={0.5} digits={1} gradient={gr.l} oninput={(v) => setLch({ l: v / 100 })} onchange={commit} />
      <Slider label="C" value={lch.c} min={0} max={MAX_C} step={0.002} digits={3} gradient={gr.c} oninput={(v) => setLch({ c: v })} onchange={commit} />
      <Slider label="H" value={lch.h} min={0} max={360} step={1} gradient={gr.lh} oninput={(v) => setLch({ h: v })} onchange={commit} />
    {/if}
  </div>

  <div class="formats mono small">
    {#each Object.entries(fmt) as [k, v]}
      <button class="fmt" title="Copy" onclick={() => navigator.clipboard?.writeText(v)}>{v}</button>
    {/each}
  </div>

  <div class="live">
    <div class="muted small">{t('vsBg')}</div>
    {#each pairs as p (p.fg + p.bg)}
      <PairRow fg={p.fg} bg={p.bg} kind={p.kind} />
    {/each}
  </div>
</section>

<style>
  .picker { display: flex; flex-direction: column; gap: 10px; }
  header { display: flex; gap: 10px; align-items: center; }
  .swatch { width: 44px; height: 44px; border-radius: 8px; flex: none; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.35); }
  .title { min-width: 0; }
  .toolbar { display: flex; gap: 8px; align-items: center; }
  .hex { flex: 1; width: 0; }
  .plane-wrap { position: relative; margin: 0 4px 0 18px; }
  .plane {
    display: block;
    width: 100%;
    aspect-ratio: 1.6;
    border-radius: 6px;
    touch-action: none;
    cursor: crosshair;
    image-rendering: auto;
  }
  .cursor {
    position: absolute;
    width: 18px;
    height: 18px;
    margin: -9px 0 0 -9px;
    border-radius: 50%;
    border: 3px solid #fff;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.7), 0 1px 4px rgb(0 0 0 / 0.5);
    pointer-events: none;
  }
  .axis { position: absolute; pointer-events: none; font-size: 10px; }
  .axis.x { right: 0; bottom: -16px; }
  .axis.y { left: -18px; top: 0; writing-mode: vertical-rl; transform: rotate(180deg); }
  .gamut { color: var(--ui-warn); min-height: 18px; visibility: hidden; margin-top: 4px; }
  .gamut.show { visibility: visible; }
  .sliders { display: flex; flex-direction: column; gap: 4px; }
  .formats { display: flex; flex-wrap: wrap; gap: 4px; }
  .fmt { min-height: 26px; padding: 1px 6px; font-size: 11px; }
  .live { border-top: 1px solid var(--ui-border); padding-top: 8px; }
</style>
