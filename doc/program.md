---

## 汎用関数（src/shared/unit-utils.js）
ユニットAIやゲームエンジンで利用可能な汎用関数群。AI開発・ロジック実装時に活用できます。

### distanceBetween(a, b)
- 概要: 2点間の距離（タイル単位）を計算。座標オブジェクト {x, y} を受け取り、ユークリッド距離を返す。
- 引数: a, b（座標オブジェクト）
- 戻り値: 距離（数値）
- 使用例: `distanceBetween(self.position, enemy.position)`
- ロジック: `Math.sqrt(dx*dx + dy*dy)` で計算。障害物や壁は考慮しない。

### findNearest(self, units)
- 概要: 配列から最も近いユニットを取得。自分の座標と各ユニットの座標を比較。
- 引数: self（自分のユニット）、units（ユニット配列）
- 戻り値: 最も近いユニット（オブジェクト）
- 使用例: `findNearest(self, enemies)`
- ロジック: 距離が最小のユニットを線形探索で返す。

### findFarthestEnemyPosition(self, enemies)
- 概要: 自分から最も遠い敵の座標を取得。
- 引数: self（自分のユニット）、enemies（敵ユニット配列）
- 戻り値: 座標オブジェクト {x, y} または null
- 使用例: `findFarthestEnemyPosition(self, enemies)`
- ロジック: 距離が最大の敵ユニットを探索し、その座標を返す。

### getEnemyCastlePosition(self, map)
- 概要: 敵の城の座標を取得。
- 引数: self（自分のユニット）、map（マップ情報）
- 戻り値: 座標オブジェクト {x, y} または null
- 使用例: `getEnemyCastlePosition(self, map)`
- ロジック: 自軍sideから敵sideを判定し、map.castlesから座標を取得。

### hasUsedSkill(unit)
- 概要: 指定ユニットが必殺技（スキル）を使ったか判定。
- 引数: unit（ユニットオブジェクト）
- 戻り値: true/false
- 使用例: `hasUsedSkill(self)`
- ロジック: unit.skill.usedフラグを参照。

### getUnitPosition(unit)
- 概要: ユニットの現在座標を取得。
- 引数: unit（ユニットオブジェクト）
- 戻り値: 座標オブジェクト {x, y} または null
- 使用例: `getUnitPosition(self)`
- ロジック: unit.positionプロパティを返す。

### getUnitHp(unit)
- 概要: ユニットの残りHPを取得。
- 引数: unit（ユニットオブジェクト）
- 戻り値: HP（数値）
- 使用例: `getUnitHp(self)`
- ロジック: unit.hpプロパティを返す。

### getUnitJob(unit)
- 概要: ユニットのジョブ名を取得。
- 引数: unit（ユニットオブジェクト）
- 戻り値: ジョブ名（文字列）
- 使用例: `getUnitJob(self)`
- ロジック: unit.jobプロパティを返す。

### getUnitsByJob(units, jobName)
- 概要: ユニット配列から指定ジョブのユニットを抽出。
- 引数: units（ユニット配列）、jobName（ジョブ名）
- 戻り値: 条件に合うユニット配列
- 使用例: `getUnitsByJob(enemies, "healer")`
- ロジック: filterでjobプロパティ一致ユニットのみ抽出。

---
# プログラム内部仕様書（開発者向け・最新版）

この文書は開発者／運営がリポジトリの内部実装を理解し、拡張・運用するための詳細仕様書です。ソースコード（主に `src/` 配下）を参照して作成しています。実装箇所への参照ファイル名を明示しているので、必要箇所は該当ソースを直接確認してください。

目次
1. プログラムの概要  
2. フォルダ構成  
3. 設定ファイル（一覧表）  
4. 実行方法（2パターン）  
5. 運用方法（学生に作らせるファイルと配置）  
6. ゲームフロー（チームロード→終了）  
7. 描画について（技術詳細）  
8. 便利関数（API／ユーティリティ関数一覧）

---

## 1. プログラムの概要

本プロジェクトはブラウザ上で動作する純ES Modulesベースのターン制対戦シミュレータ（いわゆる対戦型タワーディフェンス/自律エージェント競技プラットフォーム）です。各チーム（east/west）はユニットAIを所定のファイルで実装して配置し、運営がブラウザから「戦闘開始」を押すことで試合が開始されます。

主な特徴
- ターン制：1ターンは全ユニットの行動解決（行動順は速度降順→スロット順）
- ローカル完結：ブラウザ内でシミュレーション完結（サーバー不要）
- サンドボックス：外部危険APIを遮断した安全な実行環境を用意（`src/sdk/sandbox.js`）
- 拡張可能：ジョブ（職業）ごとの固有ロジックやアセットは追加可能（`src/engine/jobs/`、`src/config/asset-manifest.json`）

参照実装ファイル（抜粋）
- 初期化/起動: `src/main.js`
- ゲーム進行: `src/engine/game-engine.js`
- ルール: `src/engine/rules.js`
- 状態管理: `src/engine/state.js`
- レンダリング: `src/render/renderer.js`
- UI/ログ: `src/render/ui-overlay.js`
- 操作UI: `src/render/controls.js`
- サンドボックス/検証: `src/sdk/sandbox.js`, `src/sdk/validator.js`

---

## 2. フォルダ構成（主要ファイル・役割）

src/
- assets/
  - images/            : 画像アセット（castle/, jobs/, map/, effects/, ui/ 等）
  - audio/             : 音声アセット（audio-manifest.json、bgm/、jobs/、sfx/）
- config/
  - asset-manifest.json: 画像アセットのマニフェスト（レンダラ/ローダが参照）
  - team-map.json      : チーム編成・スロット設定（どのユニットファイルを使うか）
- data/
  - jobs.js            : ジョブ定義（ステータス・スキル仕様等）
  - map.js             : マップ定義（width/height/walls/castles 等）
- engine/
  - game-engine.js     : 試合の進行制御・チーム読み込み（`loadTeams`,`createBattle` 等）
  - actions.js         : 移動・攻撃・スキル等の実行ロジック（エンジン内部コマンド）
  - rules.js           : 射程/ダメージ計算/移動換算などの基準ロジック
  - state.js           : 初期状態生成・ターン進行時の状態更新
  - jobs/              : 各ジョブの固有実装（例: engineer.js）
- render/
  - renderer.js        : Canvas描画・エフェクト管理（描画順序・オーバーレイ描画）
  - ui-overlay.js      : サイドパネル、イベントログ、ユニット情報の表示・イベント処理
  - controls.js        : 操作バー（Startボタン等）、UIイベントとエミッタ接続
  - asset-loader.js    : 画像プリロード
  - audio-manager.js   : audio-manifest 読込・SE/BGM再生
  - replay-recorder.js : リプレイ記録（骨組み。UI統合は未接続）
- sdk/
  - api.js             : AI向け公開APIラッパー/設定ロード
  - sandbox.js         : ユニットファイルを安全に実行するサンドボックス
  - validator.js       : ユニットファイル・team-map 検証ロジック
- shared/
  - unit-utils.js      : 汎用ユーティリティ（距離計算など）
  - unit-position.js   : initialPosition の forward/lateral→絶対座標変換
- teams/
  - east/, west/       : 各チームのユニットファイル（unit01.js 〜 unit10.js）

ツール
- tools/: テストスクリプト（ダメージ計算/移動シミュ等）

---

## 3. 設定ファイル（主要設定名・説明・既知のデフォルト）

以下は開発時に参照すべき主要設定（ファイル）と、コードベースで期待されるキー及び既知のデフォルト値／例です。実際の値は `src/config/*.json` や `src/data/*.js` を確認してください。

- src/data/map.js（既知の内容）
  | 設定名 | 説明 | 既知の値（デフォルト / リポジトリ現在値） |
  |---|---:|---|
  | width | マップ幅（タイル数） | 30 |
  | height | マップ高さ（タイル数） | 15 |
  | walls | 壁の座標配列（{x,y,hp}） | []（コメント化あり） |
  | castles.west / castles.east | 城の座標 | west: {x:1,y:7}, east: {x:29,y:7} |
  | castles.westHp / castles.eastHp | 城の初期HP | 100 / 100 |

- src/config/team-map.json（チーム編成）
  | 設定名 | 説明 | 既知の想定デフォルト/例 |
  |---|---:|---|
  | maxUnits | チームの最大ユニット数 | 10 |
  | turnIntervalMs | ターン間のインターバル（UI再描画待ち等） | 500 (ms) |
  | unitActionIntervalMs | ユニット行動間インターバル | 1000 (ms) |
  | tileSize | 1マスあたりのピクセル | 64 |
  | west[] / east[] | スロット配列（{slot,file,job,initialPosition}） | 配列形式（各要素に file/job/initialPosition） |

- src/config/asset-manifest.json（アセット参照）
  | 設定名 | 説明 | 例 |
  |---|---:|---|
  | basePath | 画像アセットの基準パス | "./assets/images" |
  | castles.west.default / damaged | 城スプライト | "castle/fort_west.png" |
  | map.ground / map.wall.intact | マップタイル・壁スプライト | "map/ground.png" |
  | jobs.<job>.default/attack/skill/win | ジョブ別スプライトパス | "jobs/engineer.png" 等 |
  - 注: `render/asset-loader.js` はこの manifest を参照して `src/assets/images/**` からロードします。

- src/data/jobs.js（ジョブ定義）
  | 設定名 | 説明 | 例 |
  |---|---:|---|
  | <jobName>.speed | ユニットの速度（行動順） | 数値（速度÷10で移動換算） |
  | <jobName>.hp | 最大HP | 数値 |
  | <jobName>.skill | スキル仕様（cooldown等） | オブジェクト |
  - 注: jobs.js はジョブの基礎数値とスキルパラメータを提供。`src/engine/jobs/` にジョブ固有の演出/処理があればそれを併用。

（上表は実装参照用の要約です。厳密な値は各ファイルを確認してください。）

---

## 4. 実行方法（2パターン）

A. Python 簡易サーバ（軽量）
1. リポジトリルートでターミナルを開く（devcontainer内は Ubuntu 24.04）  
2. 次を実行：
   $ python3 -m http.server --directory src 8000  
3. ブラウザで http://localhost:8000/ を開く（または Codespaces のポート公開先を利用）

B. VS Code Live Server（推奨：ローカルPCで実行する場合）
0. VS Codeでsrcフォルダを開く
1. VS Code 拡張 "Live Server" をインストール  
2. `index.html` を右クリック → "Open with Live Server"  
3. 表示されたローカルURLで動作確認

起動時の流れ（簡易）
- ブラウザが `src/index.html` を読み込み、`src/main.js` が実行される。  
- `main.js` は `sdk/api.js` を用いて `config/team-map.json` / `data/jobs.js` / `data/map.js` を読み込み、アセットプリロードを待ってUIを初期化します。

---

## 5. 運用方法（学生向けファイル配置ルール・運営手順）

学生に作成させるファイル
- 各ユニットAI（1ユニット = 1ファイル）:
  - 命名規則: `unitNN.js` （NN は 01〜10 など）
  - 配置先: `src/teams/east/` または `src/teams/west/`
  - 必須実装:
    - export function init(state) { return { name: "...", memory: {} } }  // 初期化（name と memory optional）
    - export function update(state) { return actionObject }  // 毎ターン呼ばれる（move/attack/useSkill 等）
  - 実行環境: `src/sdk/sandbox.js` により安全化される。グローバルの直接参照や危険APIは制限される。

運営の配置手順
1. 学生から受け取った `unitNN.js` を該当チームフォルダにコピー（`src/teams/east/` または `src/teams/west/`）  
2. `src/config/team-map.json` の対応スロットにファイル名・job・initialPosition を設定  
3. ブラウザでページを再読み込みし、`戦闘開始` をクリックして試合を実行

検証（自動チェック）
- `src/sdk/validator.js` がユニットの必須関数（init/update 等）や初期配置の重複、ボーナス設定の異常を検知し、ログに警告を出します。運営はログを確認して不正/非互換ユニットを除外可能です。

---

## 6. ゲームフロー（内部処理の詳細・図解）

以下は実装に基づく内部フローの要点（`src/engine` 関連）と簡易図です。

1) 初期化フェーズ
- main.js → loadTeams()（`src/engine/game-engine.js`）: team-map.json を読み、各ユニットファイルを dynamic import
- validator.js により各ユニットの API（init/update）が検証
- createInitialState（`src/engine/state.js`）でユニット位置・城HP・ターンカウンタ等を初期化

2) ターンループ（startMatch / tick）
- ループ開始（UI の Start からトリガ）
- 各ターン:
  - ユニットリストを行動順（速度降順、同速度時はスロット昇順）にソート
  - 各ユニットについて:
    1. `engine/jobs/<job>.processSkill`（パッシブや毎ターン処理）を走らせる（存在する場合）
    2. サンドボックス内でユニットの `update(stateView)` を呼び出し、アクション（move/attack/useSkill 等）を取得
    3. `engine/actions.js` がコマンドを検証・実行（移動は `rules.js` で壁/衝突チェック、攻撃は射程とダメージ計算）
    4. 実行結果は `state` を更新し、必要なら `render/renderer.js` へエフェクト登録（`queueEffect` 等）
    5. ログへイベントを追加（攻撃結果、スキル使用、移動失敗、例外等）
  - ターン終了後、勝敗判定（城HP <= 0 など）。勝敗が確定すればループ終了・勝利演出へ

簡易フローチャート（ASCII）
main.js
  ↓
load config & assets
  ↓
loadTeams() → validator → createInitialState
  ↓
Start ボタン → game-engine.startMatch()
  ↓
[Turn Loop]
  → sort units by speed
  → for each unit:
      - process job passive
      - sandbox: call update()
      - actions.execute(command)
      - update state, queue effects, append log
  → check win/next turn
  ↓
End (display result)

状態とビューの分離
- エンジンは内部 `state`（ユニット/城/ターン/ログ）を保持
- `render/renderer.js` は `state` のスナップショットを受け取り描画。エフェクトはキューを持ち時間で変化させる

非同期／タイミング注意点
- 描画・アニメーション・音声はターン進行と平行して行われる。`turnIntervalMs` 等の設定で UI 側の間隔調整を行っている想定（config 参照）。

---

## 7. 描画について（技術詳細）

レンダラ: `src/render/renderer.js`
- Canvas を使った2D描画。マップサイズに応じてキャンバスをリサイズしてピクセル比を維持。
- スプライト管理:
  - `render/asset-loader.js` が `src/config/asset-manifest.json` を基に画像をプリロード
  - `renderer.js` はジョブスプライトを得るために `src/engine/jobs/index.js` の `getSprite` 等を参照（job固有差し替え対応）
- 描画順（既実装）:
  1. 背景（地面タイル）
  2. ゾーン（レーンハイライト等）
  3. 壁（wall tiles）
  4. 城（castle スプライト）
  5. ユニット（スプライト・向き）
  6. マップオーバーレイ（例: メイジファイア等）
  7. エフェクト（弾道・ヒット・命中リング）
  8. 勝利演出 / UI オーバーレイ
- ユニットの描画情報:
  - 座標はマップ座標（タイル基準）→ ピクセル位置に変換（tileSize）
  - アニメーションはフレーム単位で切替、状態（attack/skill/win）によるスプライト差し替え
- UIオーバーレイ:
  - `ui-overlay.js` が右パネル（選択ユニット情報）と下部ログを管理
  - 上部操作バーは `controls.js` が DOM を監視し、Start ボタンは接続済み。再生/停止/ステップ等はハンドラがコメントアウトされている（未接続）

エフェクトと音声
- エフェクトはレンダラ内キューで時間制御（duration, delay）
- `audio-manager.js` が `src/assets/audio/audio-manifest.json` を fetch してプリロードし、エフェクト発生時に指定キーのSEを再生

パフォーマンス考慮
- 大規模マップや多エフェクト時は draw コール削減（スプライトシート／オフスクリーンバッファ）を検討
- 現状視点は固定で、スクロール/ズームは未実装 → ビュー変換は単純化されている

---

## 8. 便利関数（ゲーム内ユーティリティ／API）

以下はエンジンと AI 実装で頻用されるユーティリティ関数（`src/shared/unit-utils.js`、`src/shared/unit-position.js`、`src/engine/rules.js` 等で提供）。関数名・引数・戻り値・処理の概要を示します。実装の詳細は該当ファイルを参照してください。

- distanceBetween(a, b)
  - 概要: 2点間のユークリッド距離を返す
  - 引数: a:{x,y}, b:{x,y}
  - 戻り値: 数値（浮動小数）
  - 処理: dx,dy の平方和の平方根

- findNearest(self, units)
  - 概要: units 配列から最も近いユニットを返す（自分との距離で判定）
  - 引数: self (ユニットオブジェクト), units (ユニット配列)
  - 戻り値: ユニットオブジェクト（最も近いもの）または null
  - 処理: 線形探索で distanceBetween を用いて最小値を選択

- findFarthestEnemyPosition(self, enemies)
  - 概要: 最も遠い敵ユニットの座標を返す
  - 引数: self, enemies
  - 戻り値: {x,y} または null
  - 処理: 最大距離の敵ユニットを探索してその position を返す

- getEnemyCastlePosition(self, map)
  - 概要: 自軍 side を判定して敵城の座標を返す
  - 引数: self (ユニット), map (MAP_DATA)
  - 戻り値: {x,y}
  - 処理: self.side を参照して map.castles.east/west を返す

- hasUsedSkill(unit)
  - 概要: ユニットがスキルを既に使ったかを判定
  - 引数: unit
  - 戻り値: boolean
  - 処理: unit.skill?.used フラグ参照

- getUnitPosition(unit)
  - 概要: ユニットの現在座標を返す
  - 引数: unit
  - 戻り値: {x,y}（存在しない場合は null）

- getUnitHp(unit)
  - 概要: 現在HPを返す
  - 引数: unit
  - 戻り値: 数値（hp）

- getUnitJob(unit)
  - 概要: ジョブ名（文字列）を返す
  - 引数: unit
  - 戻り値: string

- getUnitsByJob(units, jobName)
  - 概要: 指定ジョブのユニットだけを抽出する filter
  - 引数: units (配列), jobName (string)
  - 戻り値: フィルタ済ユニット配列

- inRange(self, target)
  - 概要: 攻撃可能か（射程判定）
  - 引数: self, target
  - 戻り値: boolean
  - 処理: rules.js の射程計算ルール（射程 ÷ 10 マス換算 等）を使用

- stepToward(from, to)
  - 概要: 1ステップ分だけ from を to 方向へ移動させた座標を返す（速度換算外）
  - 引数: from:{x,y}, to:{x,y}
  - 戻り値: {x,y}

AI 向け公開 API（`src/sdk/api.js` 経由）
- actions.moveToward(x,y) : 移動コマンドを生成（移動先は壁/混雑判定により実行結果が変わる）
- actions.attack(targetId)  : ターゲットへの攻撃コマンド
- actions.attackCastle() : 敵城への攻撃（射程内でのみ有効）
- actions.useSkill([target]) : スキル発動コマンド（ジョブごとのdoSkillと連携）
- utils.findClosest / utils.distance / utils.closestEnemy などの補助関数群

---

補足・注意事項
- リプレイ機能は `src/render/replay-recorder.js` の骨組みが存在しますが、UI との統合は未完です。必要であれば game-engine 側でイベント記録フックを追加してください。
- asset manifest / audio manifest に基づくアセットの追加は、manifest にエントリを追加し `src/assets/images` / `src/assets/audio` にファイルを置くことで機能します。`asset-loader` と `audio-manager` がプリロードします。
- 仕様変更や新ジョブ追加時は必ず `src/data/jobs.js` と `src/engine/jobs/` を同期させてください。

以上。必要があれば特定モジュール（例: game-engine の startMatch 内部、rules.js のダメージ計算式）を抜粋して更に深堀りした資料を出します。