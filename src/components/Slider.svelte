<script lang="ts">
  interface Props {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    gradient: string;
    digits?: number;
    oninput: (v: number) => void;
    onchange: () => void;
  }
  let { label, value, min, max, step, gradient, digits = 0, oninput, onchange }: Props = $props();

  function onNumber(e: Event) {
    const v = parseFloat((e.currentTarget as HTMLInputElement).value);
    if (Number.isFinite(v)) {
      oninput(Math.min(max, Math.max(min, v)));
      onchange();
    }
  }
</script>

<div class="row">
  <span class="label mono">{label}</span>
  <input
    class="range"
    type="range"
    {min}
    {max}
    {step}
    {value}
    style:--track={gradient}
    aria-label={label}
    oninput={(e) => oninput(parseFloat(e.currentTarget.value))}
    onchange={onchange}
  />
  <input
    class="num mono"
    type="number"
    {min}
    {max}
    {step}
    value={value.toFixed(digits)}
    aria-label="{label} value"
    onchange={onNumber}
  />
</div>

<style>
  .row { display: grid; grid-template-columns: 1.6em 1fr 4.8em; gap: 8px; align-items: center; }
  .label { font-weight: 600; color: var(--ui-muted); text-align: center; }
  .num { width: 100%; padding: 2px 4px; text-align: right; font-size: 13px; }
  .range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 28px;
    background: transparent;
    margin: 0;
    touch-action: pan-y;
  }
  .range::-webkit-slider-runnable-track {
    height: 18px;
    border-radius: 9px;
    background: var(--track);
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.15);
  }
  .range::-moz-range-track {
    height: 18px;
    border-radius: 9px;
    background: var(--track);
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.15);
  }
  .range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    margin-top: -2px;
    border-radius: 50%;
    background: transparent;
    border: 3px solid #fff;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.6), 0 1px 3px rgb(0 0 0 / 0.4);
  }
  .range::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: transparent;
    border: 3px solid #fff;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.6), 0 1px 3px rgb(0 0 0 / 0.4);
  }
</style>
