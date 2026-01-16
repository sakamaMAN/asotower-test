# asotower

## 目次
- [このプログラムが何のプログラムかの概要](#このプログラムが何のプログラムかの概要)
- [プログラムの実行方法](#プログラムの実行方法)
- [プログラムのフォルダ構成](#プログラムのフォルダ構成)
- [学生がプログラムをどう組めばいいかの解説](#学生がプログラムをどう組めばいいかの解説)
- [各仕様書へのリンク](#各仕様書へのリンク)

## このプログラムが何のプログラムかの概要
- 旧説明を更新しました。

## このプログラムが何のプログラムかの概要
ブラウザで動く ES Modules ベースの対戦型タワーディフェンスシミュレータです。運営が用意した両陣営のユニットAIと設定を読み込み、学生は init, moveTo, attackを使ってユニットの振る舞いを実装します。主な特徴は次のとおりです。

- 学生が作成したユニットスクリプトを読み込んで試合を実行・可視化できる。  
- UI で BGM を 5 種類から選べ、戦闘開始時に選曲をロードして再生する（BGM は src/assets/audio/audio-manifest.json で管理）。  
- 画面上のユニット名ラベルと左下のユニット一覧は陣営（east / west）ごとに色分け。HP が 0 のユニットは薄く表示される（視認性向上）。  
- AudioManager による BGM/SFX の管理、ジョブ別音声のサポート。  
- 学習向けに簡潔なユーティリティ群（shared/unit-utils.js）とテンプレートを提供。

## プログラムの実行方法
### 方法A: Python簡易サーバー
1. リポジトリ直下で以下を実行：
	 ```bash
	 python3 -m http.server --directory src 8000
	 ```
2. `http://localhost:8000`（Codespacesは転送URL）へアクセス。
3. UIでチーム編成を確認し「戦闘開始」を押す。

### 方法B: VS Code Live Server（ローカルPCで動かすときはこちら）
1. Githubから一式をZipでダウンロード、その後解凍する
2. VS Codeで本リポジトリを開く。
3. 拡張機能「Live Server」（Ritwick Dey）をインストール。
4. `src/index.html` を右クリック→**Open with Live Server**を選択（アプリが起動する）。
5. 画面で「戦闘開始」を押す。

## プログラムのフォルダ構成
```text
src/
  index.html                ブラウザエントリーポイント
  main.js                   初期化・UI制御
  engine/                   ゲーム進行・ルール（actions.js, game-engine.js, rules.js 等）
  render/                   描画・UI・エフェクト
    audio-manager.js        BGM/SFX 管理
    ui-overlay.js           画面上オーバーレイ（ログ・ユニット一覧・BGM選択）
    layers/                 ラベルやスプライト描画レイヤー（unit-label-layer.js 等）
  shared/                   共有ユーティリティ（unit-utils.js 等）
  sdk/                      学生向け API / サンドボックス
  teams/                    東西のユニットスクリプト（teams/east, teams/west）
  config/                   チーム編成・アセット設定（team-map.json, asset-manifest.json 等）
  data/                     ジョブ・マップ定義（jobs.js, map.js 等）
  assets/                   画像・音声アセット
    audio/
      audio-manifest.json
      bgm/                  BGM ファイル（main_theme1..5.mp3 等）
      sfx/                  効果音
    images/
    icons/
  styles/                   CSS（main.css 等）
  doc/                      追加ドキュメント・仕様書
```

## 学生がプログラムをどう組めばいいかの解説
- 1ユニット=1ファイル（`teams/west`または`teams/east`に配置）。
- 必須エクスポート：`init()`（初期化）、`moveTo()`（移動）、`attack()`（攻撃）。
- `init`で`job`（`data/jobs.js`定義）、`initialPosition`（castle基準または絶対座標）、`memory`、`bonus`、`name`等を返す。
- `moveTo`は毎ターン呼ばれ、移動先座標を返す。
- `attack`は毎ターン呼ばれ、攻撃対象・方法を返す。
- ユーティリティは`shared/unit-utils.js`経由で利用可能。

### 最小テンプレート例（unit01.js参考）
下は src/teams/[east|west]/ に置くユニットの最小テンプレート例です。添付の west/unit01.js と同等の形式で書かれています。必要に応じて job や initialPosition を変更してください。

```javascript
// filepath: src/teams/your-team/unit01.js
import * as utils from "../../shared/unit-utils.js";

export function init() {
  return {
    job: "sumo", // data/jobs.js にある職名を指定
    name: "猪突猛進", // 表示名
    initialPosition: {
      relativeTo: "allyCastle", // 必ず自軍城基準の相対指定を使う
      x: 13,
      y: -2
    },
    memory: {},
    bonus: { atk: 3, def: 2, spd: 2, hit: 2, hp: 1 } // 合計10 を目安に
  };
}

export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  // 敵がいれば最も近い敵へ、いなければ敵城へ向かう単純ロジック
  let targetX = self.position.x;
  let targetY = self.position.y;

  if (enemies && enemies.length > 0) {
    const nearest = utils.findNearest(self, enemies);
    targetX = nearest.position.x;
    targetY = nearest.position.y;
  } else if (enemyCastle && enemyCastle.position) {
    targetX = enemyCastle.position.x;
    targetY = enemyCastle.position.y;
  }

  return { x: targetX, y: targetY };
}

export function attack(turn, inRangeEnemies, self) {
  // 射程内に敵がいれば最初の1体を通常攻撃
  if (inRangeEnemies && inRangeEnemies.length > 0) {
    const target = inRangeEnemies[0];
    return { target, method: "normal" };
  }
  return null;
}
```

## 各仕様書へのリンク
- [運営・開発者向け仕様書](doc/program.md)
- [学生向けプログラム仕様](doc/forstudent.md)
- [画面構成ガイド](doc/display.md)
- [ジョブ一覧・詳細](doc/job.md)
- [アセット一覧](doc/imagelist.md)
- [機能リスト](doc/feature_list.md)