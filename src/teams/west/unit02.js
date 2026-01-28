import * as utils from "../../shared/unit-utils.js";

// 火力重視 - 暗殺者（後衛狙い）
export function init() {
  return {
    job: "assassin",
    name: "影刃・伊達",
    initialPosition: {
      relativeTo: "allyCastle",
      x: 12,
      y: -4
    },
    bonus: { atk: 5, def: 0, spd: 4, hit: 1, hp: 0 },
  };
}

// 後衛職を優先的に狙う
export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  if (enemies.length > 0) {
    var targets = ["healer", "archer", "mage", "engineer", "summoner"];
    for (var i = 0; i < targets.length; i++) {
      var found = utils.getUnitsByJob(enemies, targets[i]);
      if (found.length > 0) {
        return { x: found[0].position.x, y: found[0].position.y };
      }
    }
    var farthest = utils.findFarthestEnemyPosition(self, enemies);
    if (farthest) return { x: farthest.x, y: farthest.y };
  }
  return { x: enemyCastle.x, y: enemyCastle.y };
}

// シャドウステップで一気に削る
export function attack(turn, inRangeEnemies, self) {
  if (inRangeEnemies.length === 0 && utils.isEnemyCastleInRange(self)) {
    return { target: null, method: "attackCastle" };
  }

  if (inRangeEnemies.length > 0) {
    var targets = ["healer", "archer", "mage", "engineer", "summoner"];
    for (var i = 0; i < targets.length; i++) {
      var found = utils.getUnitsByJob(inRangeEnemies, targets[i]);
      if (found.length > 0) {
        if (!utils.hasUsedSkill(self)) {
          return { target: found[0], method: "skill" };
        }
        return { target: found[0], method: "normal" };
      }
    }
    var target = utils.getLowestHpEnemyInRange(self) || inRangeEnemies[0];
    if (!utils.hasUsedSkill(self)) {
      return { target: target, method: "skill" };
    }
    return { target: target, method: "normal" };
  }
  return null;
}
