import * as utils from "../../shared/unit-utils.js";

// 汎用最強 - 範囲火力（敵タンク対策、Guardianに強い）
export function init() {
  return {
    job: "mage",
    name: "炎術師・果心居士",
    initialPosition: {
      relativeTo: "allyCastle",
      x: 8,
      y: -1
    },
    bonus: { atk: 5, def: 1, spd: 2, hit: 2, hp: 0 }, // 火力最大
  };
}

function getAdvanceSign(allyCastle, enemyCastle) {
  if (!allyCastle || !enemyCastle) return 1;
  return enemyCastle.x >= allyCastle.x ? 1 : -1;
}

function getRetreatPosition(self, allyCastle, enemyCastle, distance) {
  var sign = getAdvanceSign(allyCastle, enemyCastle);
  return { x: self.position.x - sign * distance, y: self.position.y };
}

function isInEnemyRange(self, enemy, padding) {
  if (!enemy || !enemy.stats || typeof enemy.stats.range !== "number") return false;
  var enemyRange = enemy.stats.range / 10;
  var dist = utils.distanceBetween(self.position, enemy.position);
  return dist <= enemyRange + padding;
}

// 射程ベースで適切な距離を保つ
export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  // 実効射程を計算（タイル単位）
  var effectiveRange = (self.stats && typeof self.stats.range === "number") ? self.stats.range / 10 : 3;
  var safeDistance = effectiveRange * 0.85;  // 近すぎると危険
  var sign = getAdvanceSign(allyCastle, enemyCastle);

  if (enemies.length > 0) {
    // Guardian/Sumoを優先（相性有利）
    var guardians = utils.getUnitsByJob(enemies, "guardian");
    var target = guardians.length > 0 ? utils.findNearest(self, guardians) : utils.findNearest(self, enemies);

    var dist = utils.distanceBetween(self.position, target.position);

    if (isInEnemyRange(self, target, 2)) {
      return getRetreatPosition(self, allyCastle, enemyCastle, 4);
    }

    // 近すぎたら後退（射程の60%以下）
    if (dist < safeDistance) {
      // 敵から離れる方向へ
      var dx = self.position.x - target.position.x;
      var dy = self.position.y - target.position.y;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      return {
        x: self.position.x + (dx / len) * 2,
        y: self.position.y + (dy / len) * 2
      };
    }

    // 射程外なら前進
    if (!utils.canAttack(self, target)) {
      return { x: target.position.x, y: target.position.y };
    }

    // 適切な距離なら現在位置維持
    return { x: self.position.x, y: self.position.y };
  }

  // 敵がいなければ中衛ラインへ
  return { x: allyCastle.x + sign * 12, y: self.position.y };
}

// エレメンタルバーストで範囲継続ダメージ
export function attack(turn, inRangeEnemies, self) {
  // 敵が射程内にいない場合のみ城を攻撃
  if (inRangeEnemies.length === 0 && utils.isEnemyCastleInRange(self)) {
    return { target: null, method: "attackCastle" };
  }

  if (inRangeEnemies.length > 0) {
    // Guardianを優先的に狙う（相性有利）
    var guardians = utils.getUnitsByJob(inRangeEnemies, "guardian");
    if (guardians.length > 0) {
      var nearestGuardian = utils.findNearest(self, guardians);
      if (!utils.hasUsedSkill(self)) {
        return { target: nearestGuardian, method: "skill" };
      }
      return { target: nearestGuardian, method: "normal" };
    }

    var target = utils.findNearest(self, inRangeEnemies);

    // 複数いればスキルで範囲攻撃
    if (inRangeEnemies.length >= 2 && !utils.hasUsedSkill(self)) {
      return { target: target, method: "skill" };
    }
    return { target: target, method: "normal" };
  }
  return null;
}
