# Theme Bench

base16 / base24 のカラースキームを作るための PWA エディタです。PC でもスマホでも使え、ホーム画面に追加すればオフラインでも動作します。

## 機能

- **役割がひと目で分かるパレット** — 各スロットに役割の説明（日本語 / 英語）を表示。サンプル上の要素をタップすると、その色が選択されます。選択中の色を使っている箇所はハイライト表示されます。
- **カラーピッカー** — RGB / HSV / OKLCH。2D 面とスライダー、数値・HEX 入力。OKLCH で sRGB の範囲外になる領域は斜線で表示し、確定時に彩度を下げて範囲内に収めます。
- **コントラスト確認** — WCAG 2.x のコントラスト比と APCA (Lc)。役割ペア一覧、全色マトリクス、任意の 2 色比較、編集中の色の常時表示。
- **サンプル** — コードエディタ、Markdown、ターミナル、トラッカー（ProTracker 風）、2 画面ファイラー。
- **base16 / base24** — 切替可能。base24 化するときは base10〜17 を自動で生成します（後から編集できます）。
- **補助ツール** — グレー階調の自動生成（OKLCH 補間）、アクセントの明度・彩度の一括調整、ダーク ↔ ライト反転、Undo / Redo（Ctrl+Z / Ctrl+Shift+Z）。
- **保存・共有** — ブラウザ内に複数テーマを自動保存、base16/24 YAML の読み込み・書き出し（[tinted-theming](https://github.com/tinted-theming/home) 形式。旧形式の読み込みにも対応）、URL 共有。

## 開発

```sh
npm install
npm run dev      # 開発サーバー
npm test         # 色計算・入出力のユニットテスト
npm run check    # 型チェック
npm run build    # dist/ に出力
```

## デプロイ

`main` への push で GitHub Actions が GitHub Pages にデプロイします。初回のみ、リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定してください。
