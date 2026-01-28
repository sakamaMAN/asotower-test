import * as utils from "../../shared/unit-utils.js";

// 火力重視 - 遠距離DPS
export function init() {
  return {
    job: "archer",
    name: "狙撃・半蔵",
    initialPosition: {
      relativeTo: "allyCastle",
      x: 6,
      y: 4
    },
    bonus: { atk: 4, def: 0, spd: 2, hit: 4, hp: 0 },
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

// 射程を活かして距離維持
export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  var sign = getAdvanceSign(allyCastle, enemyCastle);
  if (enemies.length > 0) {
    var nearest = utils.findNearest(self, enemies);
    var dist = utils.distanceBetween(self.position, nearest.position);
    if (isInEnemyRange(self, nearest, 2)) {
      return getRetreatPosition(self, allyCastle, enemyCastle, 4);
    }
    if (dist < 35) {
      return { x: allyCastle.x + sign * 10, y: self.position.y };
    }
  }
  return { x: allyCastle.x + sign * 22, y: self.position.y };
}

// マルチショットで一気に削る
export function attack(turn, inRangeEnemies, self) {
  if (inRangeEnemies.length === 0 && utils.isEnemyCastleInRange(self)) {
    return { target: null, method: "attackCastle" };
  }
  if (inRangeEnemies.length > 0) {
    if (inRangeEnemies.length >= 2 && !utils.hasUsedSkill(self)) {
      return { target: inRangeEnemies[0], method: "skill" };
    }
    var target = utils.getLowestHpEnemyInRange(self) || inRangeEnemies[0];
    return { target: target, method: "normal" };
  }
  return null;
}
