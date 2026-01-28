import * as utils from "../../shared/unit-utils.js";

// 回復役 - 射程外退避ヒーラー
export function init() {
  return {
    job: "healer",
    name: "神医・お藤",
    initialPosition: {
      relativeTo: "allyCastle",
      x: 6,
      y: -3
    },
    bonus: { atk: 0, def: 3, spd: 5, hit: 0, hp: 2 },
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

function findNearestDamagedAlly(self) {
  var damaged = utils.getDamagedAllies(self);
  if (damaged.length === 0) return null;
  return utils.findNearest(self, damaged);
}

function getSupportPosition(ally, allyCastle, enemyCastle) {
  var offset = 4;
  var sign = getAdvanceSign(allyCastle, enemyCastle);
  return { x: ally.position.x - sign * offset, y: ally.position.y };
}

// 射程外を保ちながら味方の後方支援
export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  if (enemies.length > 0) {
    var nearestEnemy = utils.findNearest(self, enemies);
    if (nearestEnemy && isInEnemyRange(self, nearestEnemy, 2)) {
      return getRetreatPosition(self, allyCastle, enemyCastle, 5);
    }
  }

  var damaged = findNearestDamagedAlly(self);
  if (damaged) {
    return getSupportPosition(damaged, allyCastle, enemyCastle);
  }

  if (allies.length > 0) {
    var nearestAlly = utils.findNearest(self, allies);
    return getSupportPosition(nearestAlly, allyCastle, enemyCastle);
  }

  var sign = getAdvanceSign(allyCastle, enemyCastle);
  return { x: allyCastle.x + sign * 6, y: allyCastle.y };
}

// 複数の味方が傷ついたらスキル回復
export function attack(turn, inRangeEnemies, self) {
  var damaged = utils.getDamagedAllies(self);
  if (!utils.hasUsedSkill(self) && damaged.length >= 2) {
    return { target: self, method: "skill" };
  }

  if (inRangeEnemies.length === 0 && utils.isEnemyCastleInRange(self)) {
    return { target: null, method: "attackCastle" };
  }

  if (inRangeEnemies.length > 0) {
    return { target: inRangeEnemies[0], method: "normal" };
  }

  return null;
}
