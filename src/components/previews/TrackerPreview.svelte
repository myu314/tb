<script lang="ts">
  // ProTracker-style pattern view: note / sample / effect command / parameter.
  type Cell = { n?: string; s?: string; fx?: string; p?: string };
  const ROWS = 32;
  const PLAY = 9;
  const CURSOR = { row: 13, ch: 2 };

  const bass = ['A-2', 'A-2', 'C-3', 'A-2', 'G-2', 'G-2', 'E-2', 'G-2'];
  const lead: Record<number, Cell> = {
    0: { n: 'E-4', s: '05', fx: '0', p: '37' },
    6: { n: 'D-4', s: '05' },
    8: { fx: 'A', p: '02' },
    10: { n: 'C-4', s: '05', fx: '4', p: '44' },
    16: { n: 'A-3', s: '05', fx: 'C', p: '30' },
    22: { n: '===' },
    24: { n: 'G-4', s: '06', fx: '3', p: '08' },
    28: { fx: 'E', p: 'C2' },
  };

  const pattern: Cell[][] = Array.from({ length: ROWS }, (_, r) => [
    r % 4 === 0 ? { n: 'C-3', s: '01' } : r % 4 === 2 && r % 8 === 6 ? { n: 'C-3', s: '01', fx: 'C', p: '20' } : {},
    r % 8 === 4 ? { n: 'D-3', s: '02' } : r % 2 === 1 ? { n: 'F#3', s: '03', fx: 'C', p: r % 4 === 1 ? '28' : '18' } : {},
    r % 2 === 0 ? { n: bass[(r / 2) % 8], s: '04', fx: r % 8 === 0 ? '1' : undefined, p: r % 8 === 0 ? '02' : undefined } : {},
    lead[r] ?? {},
  ]);
  if (pattern[31]) pattern[31][0] = { fx: 'D', p: '00' };

  const hex2 = (n: number) => n.toString(16).toUpperCase().padStart(2, '0');
  const vu = [0.9, 0.55, 0.75, 0.35];
  const SEG = 10;
  const segColor = (i: number) => (i >= 8 ? '08' : i >= 6 ? '0A' : '0B');
</script>

<div class="trk b-00 f-05">
  <div class="top b-01 f-04">
    <span>SONG <span class="f-05">nightdrive.mod</span></span>
    <span>POS <span class="f-09">03</span>/<span class="f-09">12</span></span>
    <span>PAT <span class="f-09">07</span></span>
    <span>BPM <span class="f-09">125</span></span>
    <span>SPD <span class="f-09">6</span></span>
    <span class="play f-0B">▶ PLAY</span>
  </div>
  <div class="vus">
    <span class="rn"></span>
    {#each vu as v, c}
      <div class="vu">
        {#each Array(SEG) as _, i}
          <span class={i < v * SEG ? `b-${segColor(i)}` : 'b-01'}></span>
        {/each}
      </div>
    {/each}
  </div>
  <div class="grid">
    <div class="row head b-01">
      <span class="rn f-04"></span>
      {#each ['Kick', 'Hat', 'Bass', 'Lead'] as name, c}
        <span class="ch {c === 1 ? 'f-03' : 'f-05'}">
          {c + 1}:{name}
          {#if c === 1}<span class="mute b-08 f-00">M</span>{/if}
        </span>
      {/each}
    </div>
    {#each pattern as cells, r}
      <div
        class="row {r === PLAY ? 'b-02' : r % 16 === 0 ? 'b-01' : r % 4 === 0 ? 'b-10' : ''}"
      >
        <span class="rn {r === PLAY ? 'f-0B' : r % 4 === 0 ? 'f-0A' : 'f-04'}">{r === PLAY ? '▶' : ''}{hex2(r)}</span>
        {#each cells as cell, c}
          {@const cur = r === CURSOR.row && c === CURSOR.ch}
          {@const muted = c === 1}
          <span class="ch">
            <span class={cur ? 'b-05 f-00' : cell.n === '===' ? 'f-08' : cell.n ? (muted ? 'f-03' : 'f-05') : 'f-03'}>{cell.n ?? '···'}</span>
            <span class={cell.s ? (muted ? 'f-03' : 'f-0D') : 'f-03'}>{cell.s ?? '··'}</span>
            <span><span class={cell.fx ? (muted ? 'f-03' : 'f-0E') : 'f-03'}>{cell.fx ?? '·'}</span><span class={cell.p ? (muted ? 'f-03' : 'f-09') : 'f-03'}>{cell.p ?? '··'}</span></span>
          </span>
        {/each}
      </div>
    {/each}
  </div>
  <div class="foot b-01 f-04">
    <span>OCT <span class="f-05">4</span></span>
    <span>SMP <span class="f-0D">04</span> <span class="f-05">bass-pluck</span></span>
    <span class="f-0C">EDIT</span>
    <span class="f-08">● REC</span>
  </div>
</div>

<style>
  .trk { font-family: var(--mono); font-size: 11.5px; line-height: 1.45; min-height: 100%; display: flex; flex-direction: column; }
  .top, .foot { display: flex; gap: 12px; padding: 3px 8px; white-space: nowrap; overflow: hidden; }
  .play { margin-left: auto; }
  .vus, .row { display: grid; grid-template-columns: 3.2em repeat(4, minmax(10.5ch, 1fr)); column-gap: 1ch; padding: 0 8px; }
  .vus { padding-top: 5px; padding-bottom: 5px; }
  .vu { display: flex; gap: 2px; height: 8px; }
  .vu span { flex: 1; border-radius: 1px; }
  .grid { overflow: auto; flex: 1; }
  .row { white-space: pre; }
  .head { position: sticky; top: 0; }
  .rn { text-align: right; padding-right: 0.5ch; }
  .ch { display: flex; gap: 1ch; }
  .mute { padding: 0 3px; border-radius: 2px; font-size: 10px; align-self: center; line-height: 1.3; }
</style>
