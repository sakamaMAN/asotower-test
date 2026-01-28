# 学生向けプログラム仕様（詳しい必須関数説明）

必須実装関数（init / moveTo / attack）について、引数・返り値を細かく説明します。まずはサンプルを動かしてから読み返してください。

目次
1. このゲームの概要  
2. ゲームの勝利条件（優先順）  
3. やること（学生が行う作業）  
4. 必須実装関数（詳しく）  
　4.1 init（小見出し付きで詳細）  
　4.2 moveTo（引数を丁寧に説明）  
　4.3 attack（戻り値を用途別に詳述）  
5. 便利関数（src/shared/unit-utils.js）  
6. サンプル（init / moveTo / attack）  
7. 補足

---

## 1．このゲームの概要
ブラウザで動く対戦シミュレーションです。左右のチーム（east / west）がユニットを出し合い、相手の城（castle）を壊した方が勝ちになります。あなたはユニット1体の「頭（プログラム）」を書きます。

---

## 2．ゲームの勝利条件（優先順位）
1. どちらかの城のHPが0になったら即終了。  
2. ターン上限（デフォルト20ターン）で終了した場合：  
   - 城の残りHPが多い側が勝ち。  
   - 同じなら生存ユニット数で判定。  
   - それでも同数なら引き分け。

---

## 3．やること（学生が行う作業）
- ユニット1体につき1ファイル（例: unit01.js）を作る。  
- ファイルを src/teams/east/ または src/teams/west/ に置く。  
- ファイルは必ず次の関数を export する： init, moveTo, attack。  

---

## 4．必須実装関数（詳しく）

この節では関数ごとに「関数名」「引数」「戻り値」を表にして、さらにフィールドや使い方を丁寧に説明します。

### 4.1 init — 試合開始時に1回呼ばれる関数

- 関数名
  | 項目 | 値 |
  |---:|---|
  | 関数名 | init |

- 引数
  | 引数名 | 型 | 説明 |
  |---:|---:|---|
  | context | Object | マップ情報や城の位置を含むオブジェクト（省略可） |

- 戻り値（必ずオブジェクトを返す）
  | 戻り値フィールド | 型 | 必須 | 詳細説明 |
  |---:|---:|:---:|---|
  | job | string | 必須 | 使用する職業名（src/data/jobs.js にある正しい名前）。例: "engineer" |
  | name | string | 任意 | 画面に表示する名前（省略可） |
  | initialPosition | Object | 任意 | ユニットの初期位置指定（下で詳述） |
  | bonus | Object | 任意 | 追加パラメータ（攻撃力や速度など）。合計値は10以内（10を超えるとエラー） |

- initialPosition の指定方法（必ず「相対指定」を使うこと）
  - 理由: ユニットがどちらのチーム（east/west）として配置されるかは運営設定に依存するため、絶対座標は使わないでください。必ず自軍城（allyCastle）を基準にした相対指定を行ってください。
  - 記述例:
    - { relativeTo: "allyCastle", x: 3, y: 0 }
      - relativeTo: "allyCastle"（必須） — 自軍城を基準にすることを示す
      - x: 整数 — 自軍城から見て前方へ何マス離すか（自軍の向きに依存）
      - y: 整数（負/正可） — 縦方向のずれ（右/左）城基準。0だと城と同じ縦位置になる
  - エンジン側でこの相対指定を絶対座標に変換して配置します。例: 自軍城の前方3マス、横0で配置されます。

- init の返却例（相対指定）
  - {
    job: "soldier",
    name: "ソルくん",
    initialPosition: {
      relativeTo: "allyCastle",
      x: 12,
      y: 0
    },
    bonus: { atk: 2, def: 2, spd: 2, hit: 2, hp: 2 }, // 合計10
  };
---

### 4.2 moveTo — 毎ターン「どこへ行くか」を返す関数

- 関数名
  | 項目 | 値 |
  |---:|---|
  | 関数名 | moveTo |

- 引数（重要）
  | 引数名 | 型 | 説明 |
  |---:|---:|---|
  | turn | number | 現在のターン番号（1,2,3...） |
  | enemies | Array | 敵ユニットの配列。各要素はユニットオブジェクト（id, position, hp, job, side, ...） |
  | allies | Array | 味方ユニットの配列 |
  | enemyCastle | Object | 敵城の位置情報（enemyCastle.xでx位置が取得可能） |
  | allyCastle | Object | 自軍城の位置情報（同上） |
  | self | Object | 自分のユニット情報（position, hp, job, memory, skill 状態など） |

- ユニットオブジェクト（例）
  - {
      id: 1,
      name: "unit01",
      job: "engineer",
      side: "east",
      position: { x: 3, y: 7 },
      hp: 100,
      memory: { ... }
    }

- 戻り値（目標座標）
  | 型 | 例 | 説明 |
  |---:|---:|---|
  | Object | { x: number, y: number } | ユニットが向かう「目標座標」を返す。エンジンが速度や壁を考慮して実際の移動を行う。 |

- 城の位置の取得方法（例）
  - 引数の enemyCastle.xとenemyCastle.y を使うのが簡単で確実。

- 敵の位置の取得方法（例）
  - enemies 配列を使う:
    - 敵がいれば enemies[0].position などで座標を得られる。
    - よく使う便利関数: findNearest(self, enemies) → 最も近い敵のオブジェクトを返す。
  - 例コード:
    - if (enemies && enemies.length > 0) { const target = findNearest(self, enemies); return { x: target.position.x, y: target.position.y }; }

- 実用アドバイス
  - moveTo では「目的地」を返すだけで良い。壁や速度はエンジンが処理する。  
  - 敵がいないときは enemyCastle を目標にするのが基本戦略。

---

### 4.3 attack — 射程内で攻撃を決める関数

- 関数名
  | 項目 | 値 |
  |---:|---|
  | 関数名 | attack |

- 引数
  | 引数名 | 型 | 説明 |
  |---:|---:|---|
  | turn | number | 現在のターン |
  | inRangeEnemies | Array | 射程内にいる敵の配列（空なら攻撃対象なし） |
  | self | Object | 自分のユニット情報（position, hp, job, memory, skill 状態など） |

- inRangeEnemies の中身
  - 各要素は敵ユニットオブジェクト（id, position, hp, job, side など）。これをそのまま target に渡せば良い。

- 戻り値（詳細）
  - 基本: オブジェクトを返すか、攻撃しない場合は null を返す。

  1) 通常攻撃（normal）
    - 形式: { target: <enemyObject>, method: "normal" }
    - 使い方: 最も基本的な攻撃。射程内の敵を指定して返す。
    - 例: return { target: inRangeEnemies[0], method: "normal" };

  2) スキルを使う（skill）
    - 形式: { target: <enemyObject|null>, method: "skill", params?: {...} }
    - 使い方: ジョブ固有の特別技を使う指示。対象が不要なスキル（自己バフ等）なら target に null を渡す。
    - 注意: スキルの可否（クールダウンや使用回数）は engine/job 実装側で管理される。self.skill.used 等で確認できることがある。
    - 例（単体スキル）: return { target: inRangeEnemies[0], method: "skill" };

  3) 城を攻撃する（attackCastle）
    - 形式: { method: "attackCastle" } または { target: null, method: "attackCastle" }
    - 使い方: 敵城を直接攻撃したいときに使う。ユニットが城の射程内であれば有効。
    - 例: return { method: "attackCastle" };

- 実装のコツ
  - inRangeEnemies が空なら null を返す。  
  - スキルは強力だが制限があることが多いので、self.skill.used を確認してから使う。  
  - 城攻撃は enemyCastle の位置を確認してから命令すると安全（引数で渡される enemyCastle.position を参照）。

---

## 5．便利関数（src/shared/unit-utils.js の主な関数）
よく使う関数を一覧にします。各関数に短い概要を追加して、使い方例も示します。

| 関数名 | 引数 | 戻り値 | 関数の概要 | 使用例 |
|---|---:|---|---|---|
| distanceBetween(a, b) | a:{x,y}, b:{x,y} | 数値（距離） | 2点間のユークリッド距離を返す。引数が不正なら 0 を返す。 | d = distanceBetween(self.position, enemy.position) |
| findNearest(self, units) | self, units:配列 | 最も近いユニット または null | 指定配列から最も近いユニットを返す（未発見なら null）。 | t = findNearest(self, enemies) |
| findFarthestEnemyPosition(self, enemies) | self, enemies | {x,y} または null | 最も遠い敵の座標を返す（見つからなければ null）。 | pos = findFarthestEnemyPosition(self, enemies) |
| getDamagedAllies(self) | self | 配列 | 味方のうち HP が最大値未満のユニット配列を返す（self を除く）。state を参照するためグローバル state が必要。 | injured = getDamagedAllies(self) |
| hasUsedSkill(unit) | unit | boolean | unit.skill.used を基にスキル使用済みかを返す。 | if (!hasUsedSkill(self)) { /* スキル可 */ } |
| isEnemyCastleInRange(self, range = null) | self, range? | boolean | 指定射程（省略時は unit の通常射程）で敵城が射程内かを判定する。 | if (isEnemyCastleInRange(self)) { /* 城攻撃可能 */ } |
| getEnemyCastlePosition(self) | self | {x,y} または null | state.map の敵城座標を返す。 | castle = getEnemyCastlePosition(self) |
| getUnitPosition(unit) | unit | {x,y} または null | unit.position を安全に取得する。 | pos = getUnitPosition(enemy) |
| getUnitHp(unit) | unit | 数値 または null | unit.hp が数値なら返す、そうでなければ null。 | hp = getUnitHp(enemy) |
| getUnitJob(unit) | unit | 文字列 または null | ジョブ名を返す（未設定なら null）。 | job = getUnitJob(self) |
| getUnitsByJob(units, jobName) | units, jobName | 配列 | 指定ジョブ名と一致するユニット配列を返す（なければ空配列）。 | eng = getUnitsByJob(allies, "engineer") |
| isScoutInSkillMode(self) | self | boolean | スカウトがステルス（skill）状態にあるかをメモリ値で判定する。 | if (isScoutInSkillMode(enemy)) { /* 無視 */ } |
| getEnemiesInRange(self) | self | 配列 | 射程内の攻撃可能な敵を返す。 | targets = getEnemiesInRange(self) |
| getLowestHpEnemyInRange(self, range = null) | self, range? | ユニットオブジェクト または null | 射程内で HP が最も低い敵を返す。ステルスや HP<=0 を除外。 | low = getLowestHpEnemyInRange(self) |
| canAttack(self, target, range = null) | self, target, range? | boolean | 単純判定：存在/味方でない/HP>0/ステルスでない/射程内 の全てを満たすかを返す。 | if (canAttack(self, enemy)) { /* 攻撃可 */ } |
| willCollide(unit, targetPos) | unit, {x,y} | boolean | 指定位置へ移動したときに他ユニット・城・壁・マップ外で衝突するかの簡易判定。 | if (!willCollide(self, nextPos)) { /* 移動可能 */ } |

---

## 6．サンプル（init / moveTo / attack）
下をそのままコピーして src/teams/east/unit01.js に保存してください。init の初期配置は必ず相対指定にしてください（絶対座標を使わない）。

```javascript
// filepath: src/teams/east/unit01.js

// init は試合開始時に1回だけ呼ばれます
export function init(context) {
  return {
    job: "engineer", // data/jobs.js の職名を指定
    name: "エンジニア01",
    // 初期位置は必ず自軍城基準の相対指定にする
    initialPosition: {
      relativeTo: "allyCastle", // 自軍城を基準に配置する指定（必須）
      x: 3,               // 自軍城から前方へ3マス
      y: 0                // 横ずれ（右が正、左が負）
    },
    bonus: { atk: 2, def: 2, spd: 2, hit: 2, hp: 2 },
  };
}

// moveTo: 毎ターン「どこへ向かうか」を返す
export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  // 敵がいれば最も近い敵へ向かう
  if (enemies && enemies.length > 0) {
    const nearest = findNearest(self, enemies) || enemies[0];
    return { x: nearest.position.x, y: nearest.position.y };
  }
  // 敵がいなければ敵城へ向かう（enemyCastle があればそれを使う）
  else if (enemyCastle) {
    return { x: enemyCastle.x, y: enemyCastle.y };
  }
  // それ以外はその場に留まる
  return { x: self.position.x, y: self.position.y };
}

// attack: 射程内の敵がいるときに呼ばれる
export function attack(turn, inRangeEnemies, self) {
  if (!inRangeEnemies || inRangeEnemies.length === 0) return null;

  // HP が低い敵を狙う簡単なロジック
  let target = getLowestHpEnemyInRange(self);

  // もしスキルが使えて体力が十分ならスキル
  if (!hasUsedSkill(self) && self.hp > 30) {
    return { target, method: "skill" };
  }

  // 普通の攻撃
  return { target, method: "normal" };
}
```

---

## 7．補足
- initialPosition は必ず相対指定で書いてください（絶対座標は禁止）。これはユニットが east／west のどちらに割り当てられるか運営側で決まるためです。  
- moveTo と attack の戻り値は形式を守ればエンジンが正しく処理します。  
- エラーはブラウザ Console に出ます。動かないときはまず Console を確認してください。

まずはこのサンプルで動かし、動作を見ながら改良しましょう。