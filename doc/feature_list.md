# 対戦型タワーディフェンス プログラムイベント 機能一覧（2025年11月最新版）

本書は現在のコードベースの実装/部分実装/未実装を整理したもの。

## 1. 実行・基本仕様（実装）
- 実行: ブラウザ（純ES Modules）
- 進行: ターン制（1ターン=全ユニット行動解決）
- 勝利条件: 敵城HPが0
- 通信: ローカル完結（サーバー不要）
- マップ/城: `src/data/map.js` 定義に従う（サイズ/壁/ゾーン/城座標）

## 2. 主要ディレクトリと役割（実装）
- エントリ/ページ: `src/index.html`, `src/main.js`
- エンジン: `src/engine/`
  - `game-engine.js`（進行管理 / Sandbox連携 / チーム読込）
  - `actions.js`（行動コマンド定義）
  - `rules.js`（移動/射程/戦闘ルール）
  - `state.js`（ゲーム状態生成/更新）
  - `jobs/`（ジョブ固有挙動。現状 `engineer` 実装）
- 描画/UI: `src/render/`
  - `renderer.js`（キャンバス描画・オーバーレイ表示）
  - `ui-overlay.js`（サイドパネル/ユニット選択）
  - `controls.js`（操作バー。Startのみ接続）
  - `asset-loader.js`（画像読み込み）
  - `audio-manager.js`（音声マニフェスト読込/SE再生）
  - `replay-recorder.js`（リプレイ記録モジュール・未接続）
- SDK/安全: `src/sdk/`
  - `api.js`（AI向けAPI/設定ロード）
  - `sandbox.js`（サンドボックス実行）
  - `validator.js`（チーム/AI検証）
- データ/設定/共有:
  - `src/data/jobs.js`（ジョブ定義・数値）
  - `src/data/map.js`（マップ定義）
  - `src/config/asset-manifest.json`（画像アセット一覧）
  - `src/assets/audio/audio-manifest.json`（音声アセット一覧）
  - `src/config/team-map.json`（チーム編成・スロット・初期配置）
  - `src/shared/unit-utils.js`, `src/shared/unit-position.js`
- チーム/AI: `src/teams/east|west/unitXX.js`
- 開発補助: `tools/`（ダメージ計算テスト、移動シミュ）

## 3. チーム/ユニットAI（実装）
- 配置: `src/config/team-map.json` の `slot/file/job/initialPosition` に従い、`src/teams/east|west/unitXX.js` を読込
- 初期位置: `initialPosition` は x/y（絶対） または forward/lateral（自軍城基準）をサポート
- 実行環境: `sdk/sandbox.js` によりサンドボックス実行
- API: `sdk/api.js` 経由で actions/utils/memory 等を提供
- 行動コマンド: `engine/actions.js` 準拠（移動/攻撃/スキル/待機 など）
- 検証: `sdk/validator.js` によるチーム/配置/ボーナス等のチェック

## 4. JOBシステム（実装）
- 定義源: `src/data/jobs.js` にジョブの基礎ステータス/相性/スキル仕様を定義
- エンジン拡張: `src/engine/jobs/` にジョブ固有ロジック/演出
  - 現状 `engineer` を実装（スキル/爆発エフェクト/効果音/スプライト差し替え）
  - その他ジョブは `jobs.js` 数値定義で動作（専用演出は未実装の可能性）
- スプライト取得: `render/renderer.js` は `engine/jobs/index.js` の `getSprite` を使用

## 5. マップ/オブジェクト（実装）
- マップサイズ/城配置に追従してキャンバス自動リサイズ（Renderer）
- 描画順: 背景 → ゾーン → 壁 → 城 → ユニット → マップオーバーレイ → エフェクト → 勝利演出
- ルール: 射程/移動換算などは `engine/rules.js` に準拠

## 6. ユーザーインターフェース（部分実装）
- メインビュー: 視点固定（スクロール/ズームなし）
- 操作バー: Start（戦闘開始）のみ接続。Play/Pause/Step/速度変更はハンドラがコメントアウト（未接続）
- オーバーレイ上部: ターン数、存命ユニット数（西/東）
- サイドパネル: クリック選択した1体の詳細（ID/JOB/HP/座標(小数1桁)/速度と移動換算/射程換算/スキル使用状態）
- 未実装/将来: 複数選択、右クリック、ショートカット、ミニマップ、ホバー説明、個別表示トグル

## 7. ログ/検証（実装）
- イベントログ: 攻撃結果、スキル使用、移動失敗、城/壁ダメージ、エラー、検証警告 等を時系列追記（最新が上）
- フィルタ/検索: 未実装

## 8. アセット/オーディオ（実装）
- 画像: `config/asset-manifest.json` を `render/asset-loader.js` から読込
- 音声: `assets/audio/audio-manifest.json` を `render/audio-manager.js` から読込
- ジョブ固有SE: `engine/jobs/*` の `jobSounds` 指定に対応（例: engineer の skill/explode など）

## 9. リプレイ（未接続）
- `render/replay-recorder.js` を同梱。現状UIからの記録/再生は未接続（機能自体は実験段階）

## 10. 入力/操作（実装）
- 左クリックでユニット選択/解除
- ドラッグ選択/右クリック/キーボード操作は未実装

## 11. 開発/検証支援（実装）
- ユニット/ダメージ検証スクリプト: `tools/test_compute_damage.{js,py}`
- 移動シミュレーション補助: `tools/sim_movement.py`

## 12. 既知の未実装・制限
- UI操作系: 再生/一時停止/ステップ/速度変更、個別表示トグル、フィルタリング
- リプレイ: 記録/再生のUI統合
- 高度演出: 一部ジョブの専用エフェクト/アイコン表示
- 視点: スクロール/ズームなし

【関連ファイル（抜粋）】
- メイン: `src/index.html`, `src/main.js`
- エンジン: `src/engine/{game-engine.js, actions.js, rules.js, state.js, jobs/}`
- 描画: `src/render/{renderer.js, ui-overlay.js, controls.js, asset-loader.js, audio-manager.js}`
- データ/設定: `src/data/{map.js, jobs.js}`, `src/config/{team-map.json, asset-manifest.json}`, `src/assets/audio/audio-manifest.json`
- SDK: `src/sdk/{api.js, sandbox.js, validator.js}`
- チーム: `src/teams/east|west/unitXX.js`