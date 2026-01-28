# ASOTOWER AI 作業ガイド（毎回読む）

このファイルは Codex/Claude が作業開始時に必ず読む前提の指示書です。

## 0. 必読ルール

- すべてのタスクで最初にこのファイルを読む
- ユニット編集が含まれる場合は、以降のルールとテンプレートに従う
- 不明点（チームやユニット指定など）がある場合は、作業前に確認する

---

## 1. プロジェクト概要

- タワーディフェンス系の対戦ゲーム
- **5対5** でユニットが戦う（各チーム5体）
- 各チーム **5体のユニット** を編集可能（unit01.js〜unit05.js）
- east チームと west チームが対戦

---

## 2. ファイル構造

```
src/teams/
├── east/                    ← 東チーム
│   ├── unit01.js
│   ├── unit02.js
│   ├── unit03.js
│   ├── unit04.js
│   └── unit05.js
└── west/                    ← 西チーム
    ├── unit01.js
    ├── unit02.js
    ├── unit03.js
    ├── unit04.js
    └── unit05.js

src/data/jobs.js             ← ジョブ定義（ステータス、スキル）
src/shared/unit-utils.js     ← ユーティリティ関数
src/engine/jobs/             ← 各ジョブの実装
```

---

## 3. ユニットファイルの基本構造

各ユニットファイルには3つの関数をエクスポートする：

```javascript
import * as utils from "../../shared/unit-utils.js";

// 1. 初期設定
export function init() {
  return {
    job: "ジョブ名",
    name: "ユニット名",
    initialPosition: {
      relativeTo: "allyCastle",
      x: 12,    // 敵城方向への距離
      y: 0      // 縦位置（+が上、-が下）
    },
    bonus: { atk: 2, def: 2, spd: 2, hit: 2, hp: 2 }, // 合計10
  };
}

// 2. 移動先決定
export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  return { x: targetX, y: targetY };
}

// 3. 攻撃決定
export function attack(turn, inRangeEnemies, self) {
  return { target: 対象, method: "攻撃方法" };
  // または攻撃しない場合は null
}
```

---

## 4. 利用可能なジョブ一覧

| ジョブキー | 日本語名 | HP | 攻撃 | 防御 | 速度 | 射程 | 役割 |
|-----------|----------|-----|------|------|------|------|------|
| `soldier` | ソルジャー | 28 | 48 | 32 | 12 | 20 | 前衛アタッカー |
| `lancer` | ランサー | 22 | 28 | 22 | 30 | 38 | 中距離貫通 |
| `archer` | アーチャー | 18 | 18 | 20 | 30 | 54 | 遠距離DPS |
| `mage` | メイジ | 26 | 32 | 24 | 28 | 30 | 範囲魔法 |
| `healer` | ヒーラー | 18 | 18 | 26 | 40 | 38 | 回復支援 |
| `guardian` | ガーディアン | 36 | 14 | 54 | 8 | 28 | タンク |
| `assassin` | アサシン | 18 | 40 | 14 | 36 | 32 | 近接バースト |
| `engineer` | エンジニア | 20 | 16 | 30 | 30 | 44 | タレット設置 |
| `summoner` | サモナー | 26 | 24 | 22 | 26 | 42 | 召喚士 |
| `scout` | スカウト | 14 | 18 | 12 | 56 | 40 | 偵察・ステルス |
| `sumo` | 相撲レスラー | 56 | 30 | 30 | 8 | 16 | 高HP前衛 |

### ジョブ別スキル一覧

| ジョブ | スキル名 | 効果 |
|--------|----------|------|
| `soldier` | ブレイブチャージ | 数ターンの間、攻撃力が上がる |
| `lancer` | リーチブレイク | 前方に広い貫通攻撃 |
| `archer` | マルチショット | 射程内の敵にそれぞれ70%威力の攻撃 |
| `mage` | エレメンタルバースト | 半径2マスに数ターンの継続ダメージを与える |
| `healer` | メディカ | 味方全体を回復する |
| `guardian` | フォートレス | 一定期間防御がアップする |
| `assassin` | シャドウステップ | 瞬時に移動して背後から大ダメージを与える |
| `engineer` | タレット展開 | 数ターン広範囲の攻撃 |
| `summoner` | チャンピオンコール | 強い魔物を召喚し、数ターン攻撃させる |
| `scout` | リコンパルス | 数ターンの間、敵から見えなくなる |
| `sumo` | 土俵轟砕 | 周囲に大ダメージを与え、敵を押し戻す効果がある |

### ジョブ相性

- soldier → assassin に強い / lancer に弱い
- lancer → guardian に強い / assassin に弱い
- archer → summoner に強い / scout に弱い
- mage → guardian に強い / archer に弱い
- healer → mage に強い / assassin に弱い
- guardian → soldier に強い / mage に弱い
- assassin → lancer に強い / guardian に弱い
- engineer → scout に強い / summoner に弱い
- summoner → engineer に強い / archer に弱い
- scout → archer に強い / engineer に弱い
- sumo → assassin に強い / mage に弱い

---

## 5. ボーナスパラメータ

合計 **10ポイント以内** で自由に振り分け（10を超えるとエラー）：

```javascript
bonus: { atk: 3, def: 2, spd: 2, hit: 2, hp: 1 }
```

| キー | 効果 |
|------|------|
| `atk` | 攻撃力上昇 |
| `def` | 防御力上昇 |
| `spd` | 速度上昇 |
| `hit` | 射程上昇 |
| `hp` | 最大HP上昇 |

---

## 6. 移動パターン（moveTo関数）

### 引数

| 引数 | 内容 |
|------|------|
| `turn` | 現在のターン数 |
| `enemies` | 敵ユニット配列 |
| `allies` | 味方ユニット配列 |
| `enemyCastle` | 敵城の座標 `{x, y}` |
| `allyCastle` | 自城の座標 `{x, y}` |
| `self` | 自分自身のユニット情報 |

### パターン例

**A: 最も近い敵に向かう（基本）**
```javascript
export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  if (enemies.length > 0) {
    var nearest = utils.findNearest(self, enemies);
    return { x: nearest.position.x, y: nearest.position.y };
  }
  return { x: enemyCastle.x, y: enemyCastle.y };
}
```

**B: 敵城へ直行**
```javascript
export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  return { x: enemyCastle.x, y: enemyCastle.y };
}
```

**C: 自城付近で待機（防衛型）**
```javascript
export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  if (enemies.length > 0) {
    var nearest = utils.findNearest(self, enemies);
    var dist = utils.distanceBetween(self.position, nearest.position);
    if (dist < 30) {
      return { x: nearest.position.x, y: nearest.position.y };
    }
  }
  return { x: allyCastle.x + 10, y: allyCastle.y };
}
```

**D: 最も遠い敵を狙う**
```javascript
export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  var farthest = utils.findFarthestEnemyPosition(self, enemies);
  if (farthest) {
    return { x: farthest.x, y: farthest.y };
  }
  return { x: enemyCastle.x, y: enemyCastle.y };
}
```

---

## 7. 攻撃パターン（attack関数）

### 攻撃方法（method）

| method | 効果 |
|--------|------|
| `"normal"` | 通常攻撃（敵を攻撃） |
| `"skill"` | スキルを使用 |
| `"attackCastle"` | 敵城を攻撃 |

### パターン例

**A: 通常攻撃のみ**
```javascript
export function attack(turn, inRangeEnemies, self) {
  if (inRangeEnemies.length > 0) {
    return { target: inRangeEnemies[0], method: "normal" };
  }
  return null;
}
```

**B: スキル優先**
```javascript
export function attack(turn, inRangeEnemies, self) {
  if (inRangeEnemies.length > 0) {
    var target = utils.findNearest(self, inRangeEnemies);
    if (utils.hasUsedSkill(self) == false) {
      return { target: target, method: "skill" };
    } else {
      return { target: target, method: "normal" };
    }
  }
  return null;
}
```

**C: 城攻撃優先**
```javascript
export function attack(turn, inRangeEnemies, self) {
  if (utils.isEnemyCastleInRange(self)) {
    return { target: null, method: "attackCastle" };
  }
  if (inRangeEnemies.length > 0) {
    return { target: inRangeEnemies[0], method: "normal" };
  }
  return null;
}
```

**D: HPが低い敵を狙う**
```javascript
export function attack(turn, inRangeEnemies, self) {
  if (inRangeEnemies.length > 0) {
    var target = utils.getLowestHpEnemyInRange(self);
    if (target) {
      return { target: target, method: "normal" };
    }
  }
  return null;
}
```

---

## 8. ユーティリティ関数一覧

`import * as utils from "../../shared/unit-utils.js";` で利用可能：

| 関数 | 説明 |
|------|------|
| `utils.findNearest(self, units)` | 最も近いユニットを取得 |
| `utils.distanceBetween(a, b)` | 2点間の距離を計算 |
| `utils.hasUsedSkill(self)` | スキル使用済みか判定（true/false） |
| `utils.isEnemyCastleInRange(self)` | 敵城が射程内か判定 |
| `utils.getEnemyCastlePosition(self)` | 敵城の座標 `{x, y}` を取得 |
| `utils.getLowestHpEnemyInRange(self)` | 射程内で最もHPが低い敵を取得 |
| `utils.getDamagedAllies(self)` | ダメージを受けている味方配列を取得 |
| `utils.canAttack(self, target)` | 攻撃可能か判定 |
| `utils.willCollide(unit, targetPos)` | 移動先で衝突するか判定 |
| `utils.findFarthestEnemyPosition(self, enemies)` | 最も遠い敵の位置を取得 |
| `utils.getUnitPosition(unit)` | ユニットの座標を取得 |
| `utils.getUnitHp(unit)` | ユニットのHPを取得 |
| `utils.getUnitJob(unit)` | ユニットのジョブ名を取得 |
| `utils.getUnitsByJob(units, jobName)` | 指定ジョブのユニット配列を取得 |
| `utils.isScoutInSkillMode(self)` | スカウトがステルス中か判定 |
| `utils.getEnemiesInRange(self)` | 射程内の敵配列を取得 |

---

## 9. 編集時の注意点

1. **bonus の合計は10以内** にする（10を超えるとエラー）
2. **job は上記11種類のキー** を正確に指定
3. **import文** を忘れずに記述
4. **return** を忘れずに（moveTo は座標、attack は対象と方法 or null）
5. スキルは多くのジョブで **1回のみ使用可能**（`utils.hasUsedSkill()` でチェック）

---

## 10. 編集対象の確認事項

ユーザーに確認すべき項目：
1. どちらのチーム（east / west）を編集するか
2. 各ユニット（unit01〜05）の設定：
   - ジョブ
   - 名前
   - 初期位置（x, y）
   - ボーナス配分（合計10）
   - 移動パターン
   - 攻撃パターン

---

## 11. ローカル実行手順

### 必要なもの
- VSCode（Visual Studio Code）
- Live Server 拡張機能

### セットアップ手順

1. **プロジェクトを開く**
   - VSCodeでプロジェクトフォルダを開く

2. **Live Server拡張をインストール**
   - VSCodeの拡張機能（Extensions）から「Live Server」を検索してインストール

3. **ユニットコードを配置**
   - `src/teams/east/` または `src/teams/west/` 配下の unit01.js〜unit05.js を編集・配置

4. **実行**
   - index.html を右クリック → 「Open with Live Server」を選択
   - ブラウザでゲーム画面が起動（例：http://127.0.0.1:5500/index.html）

### ゲーム画面の操作

- **戦闘開始ボタン**：ゲームスタート（以後は観戦モード）
- **BGM選択**：開始前にドロップダウンで選択可能
- **イベントログ**：画面右側に移動/スキル/回復などのログが表示
- **ユニット情報**：画面下部に名前/職業/HP/座標などが表示
- **戦闘不能表示**：HPが0のユニットは色が薄くなる

### 開発サイクル

「ユニット作成 → 実行 → 調整」を繰り返してユニットを強化していく

---

## 12. ユニット動きのテンプレート集

### 役割別テンプレート

---

#### A. 前衛タンク型（Guardian / Sumo 向け）
敵を引きつけて味方を守る盾役。

```javascript
import * as utils from "../../shared/unit-utils.js";

export function init() {
  return {
    job: "guardian",
    name: "鉄壁のガード",
    initialPosition: { relativeTo: "allyCastle", x: 20, y: 0 },
    bonus: { atk: 0, def: 4, spd: 0, hit: 0, hp: 6 },
  };
}

export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  // 味方の前に立って壁になる
  if (enemies.length > 0) {
    var nearest = utils.findNearest(self, enemies);
    return { x: nearest.position.x, y: nearest.position.y };
  }
  // 敵がいなければ前線へ
  return { x: enemyCastle.x, y: enemyCastle.y };
}

export function attack(turn, inRangeEnemies, self) {
  // スキル（フォートレス）で防御アップを優先
  if (inRangeEnemies.length > 0) {
    var target = utils.findNearest(self, inRangeEnemies);
    if (!utils.hasUsedSkill(self)) {
      return { target: target, method: "skill" };
    }
    return { target: target, method: "normal" };
  }
  return null;
}
```

---

#### B. 近接アタッカー型（Soldier / Assassin 向け）
前線で敵を倒すダメージディーラー。

```javascript
import * as utils from "../../shared/unit-utils.js";

export function init() {
  return {
    job: "soldier",
    name: "突撃兵",
    initialPosition: { relativeTo: "allyCastle", x: 15, y: 2 },
    bonus: { atk: 5, def: 2, spd: 2, hit: 0, hp: 1 },
  };
}

export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  // HPが低い敵を優先して狙う
  if (enemies.length > 0) {
    var target = null;
    var lowestHp = 9999;
    for (var i = 0; i < enemies.length; i++) {
      var hp = utils.getUnitHp(enemies[i]);
      if (hp < lowestHp) {
        lowestHp = hp;
        target = enemies[i];
      }
    }
    if (target) {
      return { x: target.position.x, y: target.position.y };
    }
  }
  return { x: enemyCastle.x, y: enemyCastle.y };
}

export function attack(turn, inRangeEnemies, self) {
  if (inRangeEnemies.length > 0) {
    // HPが低い敵を優先
    var target = utils.getLowestHpEnemyInRange(self);
    if (!target) target = inRangeEnemies[0];

    // スキル（ブレイブチャージ）で攻撃力アップ
    if (!utils.hasUsedSkill(self)) {
      return { target: target, method: "skill" };
    }
    return { target: target, method: "normal" };
  }
  return null;
}
```

---

#### C. 遠距離アタッカー型（Archer / Mage 向け）
安全な距離から攻撃するスナイパー。

```javascript
import * as utils from "../../shared/unit-utils.js";

export function init() {
  return {
    job: "archer",
    name: "狙撃手",
    initialPosition: { relativeTo: "allyCastle", x: 10, y: -3 },
    bonus: { atk: 4, def: 0, spd: 2, hit: 4, hp: 0 },
  };
}

export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  if (enemies.length > 0) {
    var nearest = utils.findNearest(self, enemies);
    var dist = utils.distanceBetween(self.position, nearest.position);

    // 射程ギリギリを維持（近づきすぎない）
    if (dist < 40) {
      // 敵から離れる方向へ
      return { x: allyCastle.x + 15, y: self.position.y };
    }
  }
  // 適度に前進
  return { x: allyCastle.x + 30, y: self.position.y };
}

export function attack(turn, inRangeEnemies, self) {
  if (inRangeEnemies.length > 0) {
    // 複数いればスキル（マルチショット）
    if (inRangeEnemies.length >= 2 && !utils.hasUsedSkill(self)) {
      return { target: inRangeEnemies[0], method: "skill" };
    }
    // HPが低い敵を狙う
    var target = utils.getLowestHpEnemyInRange(self);
    if (target) {
      return { target: target, method: "normal" };
    }
    return { target: inRangeEnemies[0], method: "normal" };
  }
  return null;
}
```

---

#### D. サポート/ヒーラー型（Healer 向け）
味方を回復して戦線を維持する。

```javascript
import * as utils from "../../shared/unit-utils.js";

export function init() {
  return {
    job: "healer",
    name: "回復師",
    initialPosition: { relativeTo: "allyCastle", x: 8, y: 0 },
    bonus: { atk: 0, def: 3, spd: 4, hit: 0, hp: 3 },
  };
}

export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  // ダメージを受けた味方の近くへ
  var damaged = utils.getDamagedAllies(self);
  if (damaged.length > 0) {
    var target = damaged[0];
    return { x: target.position.x, y: target.position.y };
  }
  // 味方集団の中央付近に位置取り
  if (allies.length > 0) {
    var nearest = utils.findNearest(self, allies);
    return { x: nearest.position.x - 5, y: nearest.position.y };
  }
  return { x: allyCastle.x + 10, y: allyCastle.y };
}

export function attack(turn, inRangeEnemies, self) {
  // 味方が傷ついていればスキル（メディカ）優先
  var damaged = utils.getDamagedAllies(self);
  if (damaged.length >= 2 && !utils.hasUsedSkill(self)) {
    return { target: null, method: "skill" };
  }
  // 敵がいれば通常攻撃
  if (inRangeEnemies.length > 0) {
    return { target: inRangeEnemies[0], method: "normal" };
  }
  return null;
}
```

---

#### E. 城攻撃特化型（Lancer / Scout 向け）
敵を無視して城を直接狙う。

```javascript
import * as utils from "../../shared/unit-utils.js";

export function init() {
  return {
    job: "lancer",
    name: "城崩し",
    initialPosition: { relativeTo: "allyCastle", x: 12, y: 5 },
    bonus: { atk: 3, def: 0, spd: 5, hit: 2, hp: 0 },
  };
}

export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  // ひたすら敵城へ直行
  return { x: enemyCastle.x, y: enemyCastle.y };
}

export function attack(turn, inRangeEnemies, self) {
  // 城が射程内なら城を攻撃
  if (utils.isEnemyCastleInRange(self)) {
    return { target: null, method: "attackCastle" };
  }
  // 邪魔な敵がいれば排除
  if (inRangeEnemies.length > 0) {
    if (!utils.hasUsedSkill(self)) {
      return { target: inRangeEnemies[0], method: "skill" };
    }
    return { target: inRangeEnemies[0], method: "normal" };
  }
  return null;
}
```

---

#### F. 暗殺者型（Assassin / Scout 向け）
後衛の弱い敵を狙い撃ち。

```javascript
import * as utils from "../../shared/unit-utils.js";

export function init() {
  return {
    job: "assassin",
    name: "影狩り",
    initialPosition: { relativeTo: "allyCastle", x: 10, y: -5 },
    bonus: { atk: 5, def: 0, spd: 4, hit: 1, hp: 0 },
  };
}

export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  // ヒーラーやアーチャーなど後衛を優先的に狙う
  var targets = ["healer", "archer", "mage", "engineer"];
  for (var i = 0; i < targets.length; i++) {
    var found = utils.getUnitsByJob(enemies, targets[i]);
    if (found.length > 0) {
      return { x: found[0].position.x, y: found[0].position.y };
    }
  }
  // いなければ最も遠い敵（後衛にいる可能性）
  var farthest = utils.findFarthestEnemyPosition(self, enemies);
  if (farthest) {
    return { x: farthest.x, y: farthest.y };
  }
  return { x: enemyCastle.x, y: enemyCastle.y };
}

export function attack(turn, inRangeEnemies, self) {
  if (inRangeEnemies.length > 0) {
    // 後衛職を優先
    var targets = ["healer", "archer", "mage"];
    for (var i = 0; i < targets.length; i++) {
      var found = utils.getUnitsByJob(inRangeEnemies, targets[i]);
      if (found.length > 0) {
        // シャドウステップで大ダメージ
        if (!utils.hasUsedSkill(self)) {
          return { target: found[0], method: "skill" };
        }
        return { target: found[0], method: "normal" };
      }
    }
    // いなければHPが低い敵
    var target = utils.getLowestHpEnemyInRange(self);
    if (target) {
      if (!utils.hasUsedSkill(self)) {
        return { target: target, method: "skill" };
      }
      return { target: target, method: "normal" };
    }
  }
  return null;
}
```

---

#### G. 防衛型（Guardian / Engineer 向け）
自城付近で待機し、近づく敵を迎撃。

```javascript
import * as utils from "../../shared/unit-utils.js";

export function init() {
  return {
    job: "engineer",
    name: "城門番",
    initialPosition: { relativeTo: "allyCastle", x: 5, y: 0 },
    bonus: { atk: 2, def: 4, spd: 0, hit: 2, hp: 2 },
  };
}

export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  if (enemies.length > 0) {
    var nearest = utils.findNearest(self, enemies);
    var dist = utils.distanceBetween(self.position, nearest.position);

    // 敵が近くに来たら迎撃
    if (dist < 35) {
      return { x: nearest.position.x, y: nearest.position.y };
    }
  }
  // 普段は自城付近で待機
  return { x: allyCastle.x + 8, y: allyCastle.y };
}

export function attack(turn, inRangeEnemies, self) {
  if (inRangeEnemies.length > 0) {
    // タレット設置で広範囲攻撃
    if (!utils.hasUsedSkill(self)) {
      return { target: inRangeEnemies[0], method: "skill" };
    }
    return { target: inRangeEnemies[0], method: "normal" };
  }
  return null;
}
```

---

#### H. 召喚士型（Summoner 向け）
召喚獣を出して戦わせる。

```javascript
import * as utils from "../../shared/unit-utils.js";

export function init() {
  return {
    job: "summoner",
    name: "獣使い",
    initialPosition: { relativeTo: "allyCastle", x: 12, y: 3 },
    bonus: { atk: 4, def: 2, spd: 2, hit: 0, hp: 2 },
  };
}

export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  // 中距離を維持
  if (enemies.length > 0) {
    var nearest = utils.findNearest(self, enemies);
    var dist = utils.distanceBetween(self.position, nearest.position);

    if (dist < 30) {
      // 近すぎたら下がる
      return { x: allyCastle.x + 20, y: self.position.y };
    }
  }
  return { x: allyCastle.x + 25, y: self.position.y };
}

export function attack(turn, inRangeEnemies, self) {
  // 敵が見えたら即召喚
  if (inRangeEnemies.length > 0) {
    if (!utils.hasUsedSkill(self)) {
      return { target: inRangeEnemies[0], method: "skill" };
    }
    return { target: inRangeEnemies[0], method: "normal" };
  }
  return null;
}
```

---

### おすすめチーム構成例（5体）

| No | 役割 | ジョブ | 配置 |
|----|------|--------|------|
| 1 | タンク | guardian / sumo | 前衛中央 |
| 2 | 近接火力 | soldier / assassin | 前衛サイド |
| 3 | 遠距離火力 | archer / mage | 後衛 |
| 4 | サポート | healer | 後衛中央 |
| 5 | 城攻撃 / 暗殺 | lancer / scout | サイド |

---

### 配置のコツ

```
y座標のイメージ（縦位置）:
  +5  ┌─────────────┐
  +3  │   上サイド   │
   0  │   中央      │  ← 敵城方向 → x
  -3  │   下サイド   │
  -5  └─────────────┘

x座標（敵城方向への距離）:
  5-10  : 後衛（ヒーラー、アーチャー）
  10-15 : 中衛（メイジ、サモナー）
  15-25 : 前衛（ソルジャー、ガーディアン）
```
