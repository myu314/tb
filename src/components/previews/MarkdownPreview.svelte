<script lang="ts">
  import { t } from '../../lib/i18n';
  let view = $state<'rendered' | 'source'>('rendered');
</script>

<div class="md b-00 f-05">
  <div class="bar b-01">
    <div class="seg mini">
      <button class:on={view === 'rendered'} onclick={() => (view = 'rendered')}>{t('rendered')}</button>
      <button class:on={view === 'source'} onclick={() => (view = 'source')}>{t('source')}</button>
    </div>
  </div>
  {#if view === 'rendered'}
    <article>
      <h1 class="f-0D">Theme Bench</h1>
      <p><strong class="f-0A">base16</strong> は 16 色で構成される<em class="f-0E">配色の仕組み</em>です。
        詳しくは <a class="f-08" href="#top" onclick={(e) => e.preventDefault()}>tinted-theming</a>
        <span class="f-09 small">(github.com/tinted-theming)</span> をご覧ください。</p>
      <h2 class="f-0D">特徴</h2>
      <ul>
        <li><span class="f-08">•</span> 役割ごとに色を割り当てる</li>
        <li><span class="f-08">•</span> <code class="b-01 f-0B">base00</code> 〜 <code class="b-01 f-0B">base0F</code> の 16 スロット</li>
        <li><span class="f-0B">☑</span> base24 では明色を追加 <span class="f-03">（任意）</span></li>
      </ul>
      <blockquote class="bd-0C f-0C">美しい配色は、読みやすさから生まれる。</blockquote>
      <pre class="b-01"><code><span class="f-0E">const</span> <span class="f-08">bg</span> = <span class="f-0B">"#1d1f21"</span>;</code></pre>
      <hr class="bd-03" />
      <table>
        <thead><tr class="b-01"><th class="f-0D">Slot</th><th class="f-0D">Role</th></tr></thead>
        <tbody>
          <tr><td><code class="f-0B">base08</code></td><td>変数・削除</td></tr>
          <tr class="b-10"><td><code class="f-0B">base0D</code></td><td>関数・見出し</td></tr>
        </tbody>
      </table>
      <p class="f-04 small">最終更新: 2026-10-05 · <span class="b-0A f-00">ハイライト</span> · <del class="f-08">削除</del> <ins class="f-0B">追加</ins></p>
    </article>
  {:else}
    <pre class="src"><span class="f-0D"># Theme Bench</span>

<span class="f-0A">**base16**</span> は 16 色で構成される<span class="f-0E">*配色の仕組み*</span>です。
詳しくは [<span class="f-08">tinted-theming</span>](<span class="f-09">https://github.com/tinted-theming</span>) をご覧ください。

<span class="f-0D">## 特徴</span>

<span class="f-08">-</span> 役割ごとに色を割り当てる
<span class="f-08">-</span> <span class="f-0B">`base00`</span> 〜 <span class="f-0B">`base0F`</span> の 16 スロット
<span class="f-08">-</span> [x] base24 では明色を追加

<span class="f-0C">&gt; 美しい配色は、読みやすさから生まれる。</span>

<span class="f-0B">```ts</span>
<span class="f-0E">const</span> <span class="f-08">bg</span> = <span class="f-0B">"#1d1f21"</span>;
<span class="f-0B">```</span>

<span class="f-03">---</span>
<span class="f-03">&lt;!-- comment --&gt;</span></pre>
  {/if}
</div>

<style>
  .md { min-height: 100%; display: flex; flex-direction: column; }
  .bar { padding: 4px 8px; display: flex; }
  .mini button { min-height: 24px; font-size: 11px; padding: 0 8px; }
  article { padding: 8px 16px 16px; line-height: 1.7; font-size: 14px; }
  h1 { font-size: 1.6em; margin: 0.3em 0; }
  h2 { font-size: 1.2em; margin: 1em 0 0.4em; }
  p { margin: 0.5em 0; }
  a { text-decoration: underline; }
  ul { list-style: none; padding-left: 0.5em; margin: 0.4em 0; }
  li span:first-child { display: inline-block; width: 1.2em; }
  code { font-family: var(--mono); font-size: 0.9em; padding: 1px 4px; border-radius: 3px; }
  pre { font-family: var(--mono); font-size: 12.5px; padding: 8px 12px; border-radius: 6px; overflow-x: auto; margin: 0.6em 0; }
  pre code { padding: 0; }
  blockquote { border-left: 3px solid; margin: 0.6em 0; padding: 2px 12px; font-style: italic; }
  hr { border: 0; border-top: 1px solid; margin: 1em 0; }
  table { border-collapse: collapse; font-size: 13px; }
  th, td { padding: 3px 12px; text-align: left; }
  del, ins { text-decoration-thickness: 1px; }
  .small { font-size: 12px; }
  .src { margin: 0; padding: 10px 14px; white-space: pre-wrap; line-height: 1.6; flex: 1; border-radius: 0; }
</style>
