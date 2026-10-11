# Theme Bench 自作サンプル（HTML）仕様

Theme Bench の「自作サンプル」は、アプリの画面を模した HTML です。配色は直接書かず、base16 / base24 の**役割（スロット）名**で指定します。編集中のテーマの色がその場で流し込まれ、ユーザーはサンプル上の要素をタップしてその色を編集します。

この文書は、AI に HTML サンプルを作ってもらうときにそのまま渡せるように書いています。

## 1. 出力の形

- HTML の断片を 1 つ出力する（`<!doctype>` や `<html>` は不要。付いていても動きます）。
- 必要なら先頭に `<style>` を 1 つ置く。
- JavaScript は書かない（自動的に削除されます）。
- 目安は 200 行以内。画面の雰囲気が伝わる最小限の要素で構成する。

## 2. 色の指定（最重要）

**色はすべて役割で指定し、`#hex` / `rgb()` / 色名などの具体的な色は一切書かない。**

### 2.1 クラス（推奨）

| クラス | 効果 |
|---|---|
| `f-XX` | 文字色を baseXX に（`color`） |
| `b-XX` | 背景色を baseXX に（`background-color`） |
| `bd-XX` | 枠線の色を baseXX に（`border-color`。`border-style` と幅は自分で指定） |

- `XX` は `00`〜`0F` と `10`〜`17`。**16 進は大文字**（`f-0A` は可、`f-0a` は不可）。
- 1 つの要素に組み合わせてよい：`<span class="b-0D f-00">NORMAL</span>`
- **タップで色を選ぶ機能と、役割ハイライト（選択中の色を使う箇所を点線で示す）は、このクラスが付いた要素でしか働きません。** 文字や背景など、ユーザーが調整したい色は必ずクラスで付けること。

### 2.2 CSS 変数（補助）

`var(--base00)` 〜 `var(--base17)` が使えます。クラスでは表せない用途に限って使う。

```css
.tabbar { border-bottom: 1px solid var(--base02); }
.selection { background: color-mix(in srgb, var(--base0D) 30%, transparent); }
.icon { fill: var(--base0C); }
```

CSS 変数で付けた色は、タップでの色選択やハイライトの対象になりません。

## 3. 役割の意味（base16 / base24 の慣例）

| スロット | 役割 | 主な用途 |
|---|---|---|
| base00 | 背景 | 既定の背景 |
| base01 | 明るい背景 | ステータスバー、行番号の帯、タブバー、パネル |
| base02 | 選択背景 | 選択範囲、カーソル行 |
| base03 | コメント | コメント、不可視文字、控えめな文字 |
| base04 | 暗い前景 | ステータスバーの文字、補助テキスト |
| base05 | 前景 | 本文、キャレット、区切り記号、演算子 |
| base06 | 明るい前景 | 強調前景（あまり使わない） |
| base07 | 最も明るい | 明るい背景（あまり使わない） |
| base08 | 赤 | 変数、XML タグ、リンク文字、リスト記号、diff 削除、エラー |
| base09 | 橙 | 数値、真偽値、定数、XML 属性、リンク URL |
| base0A | 黄 | クラス、太字、検索ハイライトの背景、警告 |
| base0B | 緑 | 文字列、継承クラス、インラインコード、diff 追加、成功 |
| base0C | シアン | サポート、正規表現、エスケープ文字、引用 |
| base0D | 青 | 関数、メソッド、属性 ID、見出し、アクティブ要素 |
| base0E | 紫 | キーワード、ストレージ、セレクタ、斜体、diff 変更 |
| base0F | 茶 | 非推奨、埋め込み言語のタグ |
| base10 | より暗い背景 | サイドバー、非アクティブな領域（base24） |
| base11 | 最も暗い背景 | 最奥の背景、外枠（base24） |
| base12〜17 | 明るい赤・黄・緑・シアン・青・紫 | ターミナルの明色（base24） |

- ダークテーマでは base00 が最も暗く base07 が最も明るい。ライトテーマでは逆。**明暗を前提にせず、役割どおりに使う**こと。
- base16 のテーマでは、base10・base11 は base00 と、base12〜17 は対応するアクセント（base08・0A・0B・0C・0D・0E）と同じ色になる。base24 専用のスロットを使っても破綻しない。
- 反転表示（例：ステータスバーのモード表示）は `b-0D f-00` のように「アクセント背景 + base00 の文字」が定番。

## 4. 表示される環境

- サンプルは**シャドウ DOM** の中に描画される。`<style>` はサンプル内だけに効き、アプリ本体には影響しない。
- サンプル全体は `<div class="pv">` で包まれ、パネルいっぱいの高さ（`height: 100%`）になる。最上位の要素に `height: 100%` と `display: flex; flex-direction: column` を付けると、ステータスバーを下端に置ける。
- 外側の背景は既定で base00。最上位の要素に `b-00 f-05` を付けておくと確実。
- パネルの幅は**約 300〜1000px で変わる**（スマホでは 360px 前後）。固定幅は避け、`flex` と `min-width: 0`、`overflow: hidden`、`text-overflow: ellipsis` などで崩れないようにする。
- 内容がはみ出すとパネルがスクロールする。
- フォントは指定しなければアプリの UI フォント（ゴシック体）になる。コード部分は `font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace` などを明示する。外部フォントは使わない（オフラインでも使われるため）。
- **コードの行に `display: flex` を使わない。** flex の中では、要素と要素の間にある空白だけのテキスト（インデントや単語間のスペース）が描画されず、`fn main` が `fnmain` のように詰まってしまう。行は `white-space: pre` のブロックにして、行番号などは `display: inline-block` で幅を取る（7 章の例を参照）。
- 画像はなるべく使わない。アイコンはインライン SVG や文字（▸ ● ✕ など）で表す。SVG に色を付けるときは `fill="currentColor"` にして親要素に `f-XX` を付ける。

## 5. 取り除かれるもの

安全のため、次は自動的に削除される。書いても表示されない。

- 要素：`script` `iframe` `frame` `frameset` `object` `embed` `link` `meta` `base` `form` `noscript` `template`
- 属性：`on` で始まるイベント属性すべて（`onclick` など）
- URL：`javascript:` `vbscript:` `data:text/html` で始まる `href` / `src`

`<input>` や `<button>` は使えるが動作はしない（見た目だけ）。

## 6. 良いサンプルにするコツ

- **色の役割が一通り見える**ようにする：本文（05）、控えめな文字（03・04）、パネル背景（01）、選択・カーソル行（02）、アクセント（08〜0F）。
- 選択範囲（02）や検索ヒット（`b-0A f-00`）、エラー（08）、警告（0A）、成功（0B）など、**状態を表す色**も入れる。
- 実際のアプリにある要素（タブ、行番号、ステータスバー、ダイアログ、ツールチップなど）を、最小限の数で再現する。
- 同じ役割の色を別の意味で使わない（例：見出しとエラーを両方 08 にしない）。

## 7. 例

```html
<style>
  .app { height: 100%; display: flex; flex-direction: column; font: 13px/1.6 ui-monospace, Menlo, Consolas, monospace; }
  .tabs { display: flex; border-bottom: 1px solid var(--base02); }
  .tab { padding: 4px 12px; }
  .body { flex: 1; overflow: hidden; padding: 4px 0; }
  .ln { white-space: pre; }
  .gut { display: inline-block; width: 3em; text-align: right; padding-right: 10px; }
  .status { display: flex; gap: 12px; padding: 0 8px 0 0; white-space: nowrap; overflow: hidden; }
  .mode { padding: 0 8px; font-weight: 700; }
  .sp { flex: 1; }
</style>
<div class="app b-00 f-05">
  <div class="tabs b-01">
    <span class="tab b-00 f-05">main.rs</span>
    <span class="tab f-04">notes.md</span>
  </div>
  <div class="body">
    <div class="ln"><span class="gut f-03">1</span><span class="f-03">// entry point</span></div>
    <div class="ln"><span class="gut f-03">2</span><span class="f-0E">fn</span> <span class="f-0D">main</span>() {</div>
    <div class="ln b-01"><span class="gut f-04">3</span>    <span class="f-0E">let</span> <span class="b-02"><span class="f-08">name</span></span> = <span class="f-0B">"world"</span>;</div>
    <div class="ln"><span class="gut f-03">4</span>    <span class="f-0D">println!</span>(<span class="f-0B">"hi </span><span class="f-0C">\n</span><span class="f-0B">"</span>, <span class="b-0A f-00">name</span>);</div>
    <div class="ln"><span class="gut f-03">5</span>}</div>
  </div>
  <div class="status b-01 f-04">
    <span class="mode b-0D f-00">NORMAL</span>
    <span class="f-05">main.rs</span>
    <span class="sp"></span>
    <span class="f-08">✖ 1</span>
    <span class="f-0A">▲ 2</span>
    <span>3:12</span>
  </div>
</div>
```

## 8. AI への頼み方（例）

> 次の仕様に従って、Theme Bench の自作サンプル用の HTML を作ってください。題材は「（アプリの説明：画面構成、主な要素、状態表示など）」です。色は必ず `f-XX` / `b-XX` / `bd-XX` クラスか `var(--baseXX)` で指定し、具体的な色の値は使わないでください。JavaScript は不要です。HTML だけを出力してください。
>
> （この文書の 1〜7 章を貼り付ける）
