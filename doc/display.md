# 画面レイアウト仕様（2025年10月最新版）

## 1. 全体構成
- 上から順に「操作バー」「バトルキャンバス」「サイドパネル（ユニット情報／ログ）」を縦に配置。
- ミニマップやホバー説明などの追加UIは未実装。

## 2. メインバトルビュー
- マップサイズは [`data/map.js`](src/data/map.js) の定義（`MAP_DATA.width`×`MAP_DATA.height`）に追従して描画。キャンバスはマップに合わせて自動リサイズされる（[`render.Renderer`](src/render/renderer.js)）。
- 城の座標は固定値ではなくマップ定義の `castles` に従って配置（[`render.Renderer`](src/render/renderer.js)）。
- ユニットの初期配置は「自軍城基準」が原則（unitXX.js の `initialPosition` で forward/lateral または x/y 指定）。
- x/y のみ指定時はマップ絶対座標、forward/lateral 指定時は自軍城基準。
- 描画順序（抜粋）：背景 → ゾーン → 壁 → 城 → ユニット → マップオーバーレイ（メイジファイア等） → エフェクト → 勝利演出（[`render.Renderer`](src/render/renderer.js)）。
- 攻撃時には軌跡・ヒットエフェクト・命中リング、スキル時には専用エフェクトを描画。
- 視点は固定。スクロール・ズームなし。

## 3. タイムライン／操作バー（上部）
- オーバーレイには「ターン数」「存命ユニット数（西/東）」のみ表示（時間ラベルは未表示）。実装は [`render.Renderer`](src/render/renderer.js) のオーバーレイ描画。
- 操作ボタンは「戦闘開始」のみ（[`src/index.html`](src/index.html)）。再生/一時停止/ステップ/速度変更/リプレイ関連は現状未接続・未実装（ハンドラはコメントアウト、[`src/main.js`](src/main.js)・[`render.Controls`](src/render/controls.js)）。

## 4. ユニット情報パネル（右側）
- 選択ユニット（クリック）1体のステータスを表示（複数選択・ドラッグ選択は未実装）。
- 表示項目（現行実装、[`render.Overlay`](src/render/ui-overlay.js)）:
  - ID、JOB、HP、位置（小数1桁）、速度と換算移動距離（速度÷10マス/ターン）、射程（÷10マス換算）、スキル使用状態
- 現時点では「攻撃/防御/視界/ボーナス詳細/最大HP/アイコン表示」は未表示。

## 5. イベントログ（下部）
- 戦闘イベントをターン毎に時系列表示（最新が上部に追加、自動スクロール想定）。
- 表示対象：攻撃結果、スキル使用、移動失敗、城/壁ダメージ、エラー、検証警告（ボーナス超過・配置重複など）。
- フィルタリング機能は未実装。

## 6. 表示設定パネル（右下）
- 個別の表示設定トグルは未提供（将来のUI改善項目）。

## 7. 操作方法
- 左クリックでユニット選択／解除。ドラッグ選択や右クリック操作は未実装。
- ユニット選択時はサイドパネルに詳細情報が表示される。
- コピペ例やサンプルコードはそのまま動かない場合がある旨を注意書きで表示。
- キーボードショートカットは未割り当て。マウスのみで操作可能。

【関連ファイル】
- メイン：[`src/index.html`](src/index.html), [`src/main.js`](src/main.js)
- 描画：[`render.Renderer`](src/render/renderer.js), [`render.Overlay`](src/render/ui-overlay.js), [`render.Controls`](src/render/controls.js)
- データ：[`src/data/map.js`](src/data/map.js)