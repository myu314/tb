<script lang="ts">
  type Kind = 'up' | 'dir' | 'file' | 'exec' | 'link' | 'image' | 'archive' | 'hidden' | 'audio';
  interface Entry { name: string; kind: Kind; size: string; date: string; marked?: boolean; target?: string; }

  const color: Record<Kind, string> = {
    up: 'f-04', dir: 'f-0D', file: 'f-05', exec: 'f-0B', link: 'f-0C',
    image: 'f-0E', archive: 'f-08', hidden: 'f-03', audio: 'f-09',
  };
  const icon: Record<Kind, string> = {
    up: '↰', dir: '▸', file: ' ', exec: '*', link: '@', image: ' ', archive: ' ', hidden: ' ', audio: '♪',
  };

  const left: Entry[] = [
    { name: '..', kind: 'up', size: '<UP>', date: '' },
    { name: 'samples', kind: 'dir', size: '<DIR>', date: '10-02' },
    { name: 'songs', kind: 'dir', size: '<DIR>', date: '10-04' },
    { name: '.config', kind: 'hidden', size: '<DIR>', date: '09-12' },
    { name: 'nightdrive.mod', kind: 'audio', size: '182K', date: '10-05', marked: true },
    { name: 'sunrise.xm', kind: 'audio', size: '1.2M', date: '10-01', marked: true },
    { name: 'render.sh', kind: 'exec', size: '1.1K', date: '09-30' },
    { name: 'latest', kind: 'link', size: '12', date: '10-05', target: 'songs/v3' },
    { name: 'cover.png', kind: 'image', size: '640K', date: '09-28' },
    { name: 'backup.tar.zst', kind: 'archive', size: '48M', date: '09-20' },
    { name: 'README.md', kind: 'file', size: '2.3K', date: '09-18' },
    { name: '.DS_Store', kind: 'hidden', size: '6.0K', date: '09-01' },
  ];
  const right: Entry[] = [
    { name: '..', kind: 'up', size: '<UP>', date: '' },
    { name: 'kick', kind: 'dir', size: '<DIR>', date: '08-11' },
    { name: 'snare', kind: 'dir', size: '<DIR>', date: '08-11' },
    { name: 'bass-pluck.wav', kind: 'audio', size: '88K', date: '10-02' },
    { name: 'pad-warm.wav', kind: 'audio', size: '1.9M', date: '10-02' },
    { name: 'waveform.png', kind: 'image', size: '22K', date: '10-02' },
    { name: 'pack.zip', kind: 'archive', size: '31M', date: '07-30' },
    { name: 'convert', kind: 'exec', size: '14K', date: '07-02' },
  ];
  const panes = [
    { path: '~/music', entries: left, cursor: 5, active: true },
    { path: '~/music/samples', entries: right, cursor: 3, active: false },
  ];
</script>

<div class="filer b-11 f-05">
  <div class="panes">
    {#each panes as pane}
      <div class="pane b-00 bd-{pane.active ? '0D' : '02'}">
        <div class="path {pane.active ? 'b-0D f-00' : 'b-01 f-04'}">{pane.path}</div>
        <div class="cols f-03"><span>Name</span><span>Size</span><span>Date</span></div>
        {#each pane.entries as e, i}
          {@const cur = i === pane.cursor}
          <div class="ent {cur ? (pane.active ? 'b-02' : 'b-01') : ''}">
            <span class="name {e.marked ? 'f-0A' : color[e.kind]}" class:bold={e.kind === 'dir'}>
              <span class="ic">{e.marked ? '✓' : icon[e.kind]}</span>{e.name}{#if e.target}<span class="f-03"> → {e.target}</span>{/if}
            </span>
            <span class="size {e.kind === 'dir' || e.kind === 'up' ? 'f-0D' : 'f-04'}">{e.size}</span>
            <span class="date f-03">{e.date}</span>
          </div>
        {/each}
        <div class="spacer"></div>
        <div class="info b-01 f-04">
          {#if pane.active}
            <span class="f-0A">2 marked</span> · 1.4M / 52G free
          {:else}
            8 items · 33M
          {/if}
        </div>
      </div>
    {/each}
  </div>
  <div class="cmd f-05"><span class="f-0B">$</span> cp -r <span class="f-0A">%m</span> <span class="f-0D">%D</span><span class="b-05 f-00"> </span></div>
  <div class="dialog b-01 bd-0A f-05">
    <span class="f-0A">⚠</span> Overwrite <span class="f-0E">sunrise.xm</span>?
    <span class="btn b-0D f-00">Yes</span><span class="btn b-02 f-05">No</span><span class="btn b-02 f-08">Cancel</span>
  </div>
  <div class="fkeys">
    {#each ['Help', 'Menu', 'View', 'Edit', 'Copy', 'Move', 'Mkdir', 'Del', 'Pull', 'Quit'] as k, i}
      <span><span class="f-05">{i + 1}</span><span class="lbl b-0C f-00">{k}</span></span>
    {/each}
  </div>
</div>

<style>
  .filer { font-family: var(--mono); font-size: 12px; line-height: 1.5; min-height: 100%; display: flex; flex-direction: column; padding: 4px; gap: 4px; }
  .panes { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; flex: 1; min-height: 0; }
  .pane { border: 1px solid; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
  .path { padding: 1px 6px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cols, .ent { display: grid; grid-template-columns: 1fr 5ch 5ch; gap: 1ch; padding: 0 6px; white-space: nowrap; }
  .cols { font-size: 10px; }
  .name { overflow: hidden; text-overflow: ellipsis; }
  .ic { display: inline-block; width: 1.4ch; }
  .size, .date { text-align: right; }
  .bold { font-weight: 700; }
  .spacer { flex: 1; }
  .info { padding: 1px 6px; font-size: 11px; white-space: nowrap; overflow: hidden; }
  .cmd { padding: 0 4px; }
  .dialog { border: 1px solid; padding: 4px 8px; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .btn { padding: 0 8px; }
  .btn:first-of-type { margin-left: auto; }
  .fkeys { display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px; font-size: 11px; }
  .fkeys > span { display: flex; min-width: 0; }
  .lbl { flex: 1; padding: 0 2px; overflow: hidden; text-overflow: clip; white-space: nowrap; }
</style>
