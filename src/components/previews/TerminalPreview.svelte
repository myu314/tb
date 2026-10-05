<script lang="ts">
  // ANSI index → slot (base16-shell convention; base24 brights use base12–17).
  const ANSI = [
    ['00', 'black'], ['08', 'red'], ['0B', 'green'], ['0A', 'yellow'],
    ['0D', 'blue'], ['0E', 'magenta'], ['0C', 'cyan'], ['05', 'white'],
    ['03', 'br.black'], ['12', 'br.red'], ['14', 'br.green'], ['13', 'br.yellow'],
    ['16', 'br.blue'], ['17', 'br.magenta'], ['15', 'br.cyan'], ['07', 'br.white'],
  ];
</script>

<div class="term b-00 f-05">
  <div class="title b-11 f-04"><span class="dots"><i class="b-08"></i><i class="b-0A"></i><i class="b-0B"></i></span> zsh — ~/projects/theme-bench</div>
  <pre><span class="f-0B">myu@box</span> <span class="f-0D">~/projects/theme-bench</span> <span class="f-0E">(main)</span> <span class="f-05">$</span> ls -la
<span class="f-04">drwxr-xr-x</span>  <span class="f-0D bold">src/</span>
<span class="f-04">drwxr-xr-x</span>  <span class="f-0D bold">public/</span>
<span class="f-04">-rwxr-xr-x</span>  <span class="f-0B bold">build.sh</span>
<span class="f-04">lrwxrwxrwx</span>  <span class="f-0C">latest</span> <span class="f-03">-&gt;</span> dist/v0.1
<span class="f-04">-rw-r--r--</span>  <span class="f-0E">icon.png</span>
<span class="f-04">-rw-r--r--</span>  <span class="f-08">themes.tar.gz</span>
<span class="f-04">-rw-r--r--</span>  package.json
<span class="f-04">-rw-r--r--</span>  <span class="f-03">.gitignore</span>
<span class="f-0B">myu@box</span> <span class="f-0D">~/projects/theme-bench</span> <span class="f-0E">(main)</span> <span class="f-05">$</span> git status -s
 <span class="f-08">M</span> src/App.svelte
<span class="f-0B">A </span> src/lib/color.ts
<span class="f-08">??</span> notes.md
<span class="f-0B">myu@box</span> <span class="f-0D">~/projects/theme-bench</span> <span class="f-0E">(main)</span> <span class="f-05">$</span> npm test
 <span class="b-0B f-00 bold"> PASS </span> src/lib/color.test.ts
 <span class="b-08 f-00 bold"> FAIL </span> src/lib/io.test.ts
   <span class="f-08">✖ expected "#1d1f21" to be "#1d1f22"</span>
 <span class="f-0A">⚠ 1 warning</span>  <span class="f-12">✖ error</span>  <span class="f-14">✔ bright ok</span>  <span class="f-13">⚑ bright warn</span>
<span class="f-0B">myu@box</span> <span class="f-0D">~/projects/theme-bench</span> <span class="f-0E">(main)</span> <span class="f-08">✗</span> <span class="b-05 f-00"> </span></pre>
  <div class="ansi">
    {#each ANSI as [s, name], i}
      <div class="cell">
        <span class="blk b-{s}"></span>
        <span class="lbl f-04">{i} <span class="f-{s}">{name}</span></span>
      </div>
    {/each}
  </div>
</div>

<style>
  .term { font-family: var(--mono); font-size: 12.5px; min-height: 100%; display: flex; flex-direction: column; }
  .title { padding: 4px 10px; font-size: 11px; display: flex; gap: 10px; align-items: center; }
  .dots { display: inline-flex; gap: 5px; }
  .dots i { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  pre { margin: 0; padding: 8px 12px; line-height: 1.55; white-space: pre; overflow-x: auto; font-family: inherit; }
  .bold { font-weight: 700; }
  .ansi { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; padding: 8px 12px 12px; }
  .cell { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .blk { height: 18px; border-radius: 3px; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.3); }
  .lbl { font-size: 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
