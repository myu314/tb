<script lang="ts"></script>

<!-- Syntax-highlighted editor following the base16 styling guidelines. -->
<div class="editor b-00 f-05">
  <div class="tabs b-10">
    <span class="tab b-00 f-05">loader.ts</span>
    <span class="tab f-04">theme.yaml</span>
  </div>
  <div class="body">
    <pre class="ln"><span class="gut b-01 f-03">1</span><span class="mk"></span><span class="f-03">// Load a scheme and apply it to the app</span></pre>
    <pre class="ln"><span class="gut b-01 f-03">2</span><span class="mk f-0B">▎</span><span class="f-0E">import</span> {'{'} parse {'}'} <span class="f-0E">from</span> <span class="f-0B">"yaml"</span>;</pre>
    <pre class="ln"><span class="gut b-01 f-03">3</span><span class="mk"></span></pre>
    <pre class="ln"><span class="gut b-01 f-03">4</span><span class="mk"></span><span class="f-0F">@deprecated</span><span class="f-03">("use loadAll")</span></pre>
    <pre class="ln"><span class="gut b-01 f-03">5</span><span class="mk f-0E">▎</span><span class="f-0E">export class</span> <span class="f-0A">SchemeLoader</span> <span class="f-0E">extends</span> <span class="f-0B">Base</span> {'{'}</pre>
    <pre class="ln"><span class="gut b-01 f-03">6</span><span class="mk"></span>  <span class="f-0E">private</span> <span class="b-02"><span class="f-08">cache</span> = <span class="f-0E">new</span> <span class="f-0A">Map</span>&lt;<span class="f-0A">string</span>,</span> <span class="f-0A">Theme</span>&gt;();</pre>
    <pre class="ln"><span class="gut b-01 f-03">7</span><span class="mk"></span>  <span class="f-0E">static readonly</span> <span class="f-09">MAX</span> = <span class="f-09">0x10</span>;</pre>
    <pre class="ln"><span class="gut b-01 f-03">8</span><span class="mk"></span></pre>
    <pre class="ln"><span class="gut b-01 f-03">9</span><span class="mk"></span>  <span class="f-0E">async</span> <span class="f-0D">load</span>(<span class="f-08">path</span>: <span class="f-0A">string</span>): <span class="f-0A">Promise</span>&lt;<span class="b-0A f-00">Theme</span>&gt; {'{'}</pre>
    <pre class="ln cur b-01"><span class="gut b-02 f-05">10</span><span class="mk"></span>    <span class="f-0E">const</span> <span class="f-08">text</span> = <span class="f-0E">await</span> <span class="f-0D">fetch</span>(<span class="f-08">path</span>).<span class="f-0D">then</span>((<span class="f-08">r</span>) <span class="f-05">=&gt;</span> <span class="f-08">r</span>.<span class="f-0D">text</span>());<span class="caret b-05"></span></pre>
    <pre class="ln"><span class="gut b-01 f-03">11</span><span class="mk"></span>    <span class="f-0E">if</span> (!<span class="f-0C">/^system:\s*"base(16|24)"/m</span>.<span class="f-0D">test</span>(<span class="f-08">text</span>)) {'{'}</pre>
    <pre class="ln"><span class="gut b-01 f-03">12</span><span class="mk f-08">▁</span>      <span class="f-0E">throw new</span> <span class="f-0A">Error</span>(<span class="f-0B">`invalid scheme<span class="f-0C">\n</span><span class="f-08">${'{'}path{'}'}</span>`</span>);</pre>
    <pre class="ln"><span class="gut b-01 f-03">13</span><span class="mk"></span>    {'}'}</pre>
    <pre class="ln"><span class="gut b-01 f-03">14</span><span class="mk"></span>    <span class="f-0E">return</span> <span class="f-0D">parse</span>(<span class="err f-05">txt</span>) <span class="f-0E">as</span> <span class="f-0A">Theme</span>; <span class="f-03">// </span><span class="f-0A">TODO</span><span class="f-03">: cache</span></pre>
    <pre class="ln"><span class="gut b-01 f-03">15</span><span class="mk"></span>  {'}'}</pre>
    <pre class="ln"><span class="gut b-01 f-03">16</span><span class="mk"></span>{'}'}<span class="f-03 ws">↵</span></pre>
  </div>
  <div class="status b-01 f-04">
    <span class="mode b-0D f-00">NORMAL</span>
    <span class="f-05">loader.ts</span>
    <span class="f-0E">⎇ main</span>
    <span class="sp"></span>
    <span class="f-08">✖ 1</span>
    <span class="f-0A">▲ 2</span>
    <span>10:52</span>
  </div>
</div>

<style>
  .editor { font-family: var(--mono); font-size: 12.5px; line-height: 1.6; display: flex; flex-direction: column; min-height: 100%; }
  .tabs { display: flex; font-size: 12px; }
  .tab { padding: 4px 12px; }
  .body { padding: 4px 0; flex: 1; overflow-x: auto; }
  .ln { white-space: pre; margin: 0; font: inherit; }
  .gut { display: inline-block; width: 3em; text-align: right; padding-right: 8px; user-select: none; }
  .mk { display: inline-block; width: 1em; text-align: center; }
  .caret { display: inline-block; width: 2px; height: 1.2em; vertical-align: text-bottom; animation: blink 1s steps(1) infinite; }
  @keyframes blink { 50% { opacity: 0; } }
  .err { text-decoration: underline wavy var(--base08); text-underline-offset: 3px; }
  .status { display: flex; gap: 10px; padding: 0 8px 0 0; font-size: 12px; white-space: nowrap; overflow: hidden; }
  .mode { padding: 0 8px; font-weight: 700; }
  .sp { flex: 1; }
</style>
