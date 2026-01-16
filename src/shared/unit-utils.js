import { rangePerTurn,getAttackableEnemies } from "../engine/rules.js";

/**
 * 自分のチームで、ダメージを受けている味方ユニットの配列を返します。
 * グローバルの state (window.__ASOTOWER_STATE__) を参照します。
 *
 * @param {Object} self - 自分のユニットオブジェクト
 * @returns {Array<Object>} ダメージを受けている味方ユニットの配列。条件に合うものがなければ空配列。
 */
export function getDamagedAllies(self) {
  const state = window.__ASOTOWER_STATE__;
  isScoutInSkillMode
  if (!state) return [];
  const allies = state.units.filter(u => u.side === self.side && u.id !== self.id && u.hp > 0);
  return allies.filter(ally => ally.hp < ally.stats.hp);
}

/**
 * 指定ユニットがスキルを既に使ったかどうかを返します。
 *
 * @param {Object} unit - 判定対象のユニットオブジェクト
 * @returns {boolean} 既にスキルを使用していれば true、そうでなければ false
 */
export function hasUsedSkill(unit) {
  return !!(unit.skill && unit.skill.used);
}

/**
 * 指定ユニットの射程に敵の城が入っているか判定します。
 * 範囲はデフォルトでユニットの通常射程 (rangePerTurn) を使います。
 *
 * @param {Object} self - 自分のユニットオブジェクト
 * @param {number|null} range - 判定に使う射程（省略時は rangePerTurn(self)）
 * @returns {boolean} 城が射程内なら true、そうでなければ false
 */
export function isEnemyCastleInRange(self, range = null) {
  const state = window.__ASOTOWER_STATE__;
  if (!state) return false;
  const enemySide = self.side === 'west' ? 'east' : 'west';
  const castle = state?.map?.castles?.[enemySide];
  if (!castle) return false;
    const dist = Math.hypot(self.position.x - castle.x, self.position.y - castle.y);
    const attackRange = range !== null ? range : rangePerTurn(self);
  //console.log("dist:", dist, " attackRange:", attackRange);
  return dist <= attackRange;
}

/**
 * 敵の城の座標を返します。
 *
 * @param {Object} self - 自分のユニットオブジェクト
 * @returns {Object|null} { x, y } の座標オブジェクト、存在しなければ null
 */
export function getEnemyCastlePosition(self) {
  const state = window.__ASOTOWER_STATE__;
  if (!state) return null;
  const enemySide = self.side === 'west' ? 'east' : 'west';
  return state?.map?.castles?.[enemySide] ?? null;
}

// ユニットAI・行動ロジック用の汎用関数をまとめるファイル
// 例: 距離計算、最も近い敵の取得など

/**
 * 2点間の距離を計算して返します。
 *
 * @param {Object} a - 座標オブジェクト { x, y }
 * @param {Object} b - 座標オブジェクト { x, y }
 * @returns {number} 2点間のユークリッド距離。引数が不正なら 0 を返します。
 */
export function distanceBetween(a, b) {
  if (!a || !b) return 0;
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 指定のユニットから見て、配列 units の中で最も近いユニットを返します。
 *
 * @param {Object} self - 自分のユニットオブジェクト（位置 self.position を使います）
 * @param {Array<Object>} units - 検索対象のユニット配列
 * @returns {Object|null} 最も近いユニットオブジェクト。見つからなければ null。
 */
export function findNearest(self, units) {
  var minDist = 99999;
  var nearest = null;
  for (var i = 0; i < units.length; i++) {
    var dist = distanceBetween(self.position, units[i].position);
    if (dist < minDist) {
      minDist = dist;
      nearest = units[i];
    }
  }
  return nearest;
}

/**
 * 自分から最も遠い敵の位置を返します。
 * ステルス中（isScoutInSkillMode が true）の敵は除外します。
 *
 * @param {Object} self - 自分のユニットオブジェクト
 * @param {Array<Object>} enemies - 敵ユニット配列
 * @returns {Object|null} 最も遠い敵の座標 { x, y }、見つからなければ null
 */
export function findFarthestEnemyPosition(self, enemies) {
  let maxDist = -1;
  let farthest = null;
  for (let i = 0; i < enemies.length; i++) {
    if( isScoutInSkillMode(enemies[i])) {
      //ステルス中の敵は除外
      continue;
    }
    const dist = distanceBetween(self.position, enemies[i].position);
    if (dist > maxDist) {
      maxDist = dist;
      farthest = enemies[i];
    }
  }
  return farthest ? { x: farthest.position.x, y: farthest.position.y } : null;
}

/**
 * 指定したユニットの座標を返します。
 *
 * @param {Object} unit - ユニットオブジェクト
 * @returns {Object|null} { x, y } または null
 */
export function getUnitPosition(unit) {
  return unit.position ? { x: unit.position.x, y: unit.position.y } : null;
}

/**
 * 指定したユニットの現在のHPを返します。
 *
 * @param {Object} unit - ユニットオブジェクト
 * @returns {number|null} HP（数値）または null
 */
export function getUnitHp(unit) {
  return typeof unit.hp === "number" ? unit.hp : null;
}

/**
 * 指定したユニットのジョブ名を返します。
 *
 * @param {Object} unit - ユニットオブジェクト
 * @returns {string|null} ジョブキー（例: 'archer'）または null
 */
export function getUnitJob(unit) {
  return unit.job || null;
}

/**
 * ユニット配列から、指定したジョブ名と一致するユニットを全て返します。
 *
 * @param {Array<Object>} units - ユニット配列
 * @param {string} jobName - 検索するジョブ名
 * @returns {Array<Object>} 条件に合うユニット配列（なければ空配列）
 */
export function getUnitsByJob(units, jobName) {
  if (!Array.isArray(units)) return [];
  return units.filter(u => u.job === jobName);
}

/**
 * 指定ユニットがスカウトのスキル（ステルス）を発動中か判定します。
 *
 * @param {Object} self - ユニットオブジェクト
 * @returns {boolean} ステルス中であれば true、そうでなければ false
 */
export function isScoutInSkillMode(self) {
  return (
    self.job === 'scout' &&
    self.skill &&
    self.memory &&
    self.memory.stealth &&
    typeof self.memory.stealth.turns === 'number' &&
    self.memory.stealth.turns > 0
  );
}

/**
 * 指定ユニットの射程に入っている敵ユニットを配列で返します。
 * 内部で getAttackableEnemies(state, self) を使います。
 *
 * @param {Object} self - 自分のユニットオブジェクト
 * @returns {Array<Object>} 射程内で攻撃可能な敵ユニットの配列（なければ空配列）
 */
export function getEnemiesInRange(self) {
  const state = window.__ASOTOWER_STATE__;
  return getAttackableEnemies(state, self);
}

/**
 * 指定ユニットの射程内にいる敵のうち、HPが最も低い敵を返します。
 *
 * @param {Object} self - 自分のユニットオブジェクト
 * @param {number|null} range - 判定に使う射程（省略時はユニットの通常射程を使用）
 * @returns {Object|null} 最もHPが低い敵ユニット、見つからなければ null
 */
export function getLowestHpEnemyInRange(self, range = null) {
  const state = window.__ASOTOWER_STATE__;
  if (!state || !self || !self.position) return null;
  let targets = getAttackableEnemies(state, self) || [];
  // 任意の range が指定されていれば距離でフィルタ
  if (range !== null) {
    targets = targets.filter(t => distanceBetween(self.position, t.position) <= range);
  }
  // ステルス中の敵やHP0以下は除外
  targets = targets.filter(t => t && t.hp > 0 && t.side !== self.side && !isScoutInSkillMode(t));
  if (targets.length === 0) return null;
  // 最もHPが低いものを返す
  return targets.reduce((min, cur) => (cur.hp < min.hp ? cur : min));
}

/**
 * 指定ターゲットに攻撃できるかを単純判定します。
 * 判定は：存在するか、味方でないか、HP>0、ステルスではないか、射程内か、で行います。
 *
 * @param {Object} self - 自分のユニットオブジェクト
 * @param {Object} target - 攻撃対象ユニットオブジェクト
 * @param {number|null} range - 使用する射程（省略時はユニットの通常射程を使用）
 * @returns {boolean} 攻撃可能なら true、そうでなければ false
 */
export function canAttack(self, target, range = null) {
  if (!self || !target || !self.position || !target.position) return false;
  if (target.hp <= 0) return false;
  if (target.side === self.side) return false;
  if (isScoutInSkillMode(target)) return false;
  const attackRange = range !== null ? range : rangePerTurn(self);
  const dist = distanceBetween(self.position, target.position);
  return dist <= attackRange;
}

/**
 * 指定位置に移動したときに他のユニットや城、地図外／壁などとぶつかる（衝突する）かどうかを返します。
 * この関数は簡易判定です。マップの構造によっては追加の判定（通行不可タイルの形式合わせ）が必要です。
 *
 * @param {Object} unit - 移動するユニットオブジェクト
 * @param {Object} targetPos - 目標座標オブジェクト { x, y }
 * @returns {boolean} 衝突する可能性があれば true、問題なければ false
 */
export function willCollide(unit, targetPos) {
  const state = window.__ASOTOWER_STATE__;
  if (!state || !unit || !targetPos) return false;

  const tx = Math.floor(targetPos.x);
  const ty = Math.floor(targetPos.y);

  // 他ユニットと同じセルに入るか
  for (const u of state.units || []) {
    if (!u || u.id === unit.id) continue;
    if (u.hp <= 0) continue;
    const ux = Math.floor(u.position.x);
    const uy = Math.floor(u.position.y);
    if (ux === tx && uy === ty) return true;
  }

  // 敵味方の城位置とぶつかるか
  const enemyCastle = getEnemyCastlePosition(unit);
  if (enemyCastle && Math.floor(enemyCastle.x) === tx && Math.floor(enemyCastle.y) === ty) return true;
  const ownCastle = state?.map?.castles?.[unit.side];
  if (ownCastle && Math.floor(ownCastle.x) === tx && Math.floor(ownCastle.y) === ty) return true;

  // 簡易的にマップ外や単純な壁タイルをチェック（map.tiles が2次元配列で 1 を壁とする想定）
  const map = state.map;
  if (map) {
    const x = tx;
    const y = ty;
    if (typeof map.width === 'number' && typeof map.height === 'number') {
      if (x < 0 || y < 0 || x >= map.width || y >= map.height) return true;
    }
    if (Array.isArray(map.tiles) && map.tiles[y] && typeof map.tiles[y][x] !== 'undefined') {
      const tile = map.tiles[y][x];
      // tile の値により通行不可を判定する慣習がプロジェクトで異なるため、ここでは 1 を「壁」として扱う
      if (tile === 1) return true;
    }
  }

  return false;
}