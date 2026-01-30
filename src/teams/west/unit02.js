import * as utils from "../../shared/unit-utils.js";

export function init() {
  return {
    job: "guardian",
    name: "スキルくん",
    initialPosition: {
      relativeTo: "allyCastle",
      x: 13,
      y: -1
    },
    bonus: { attack: 0, defense: 10, speed: 0, range: 0, hp: 0 }, // 合計10
  };
}

// どこに移動するか決める（最も近い敵がいればその座標、いなければ敵城）
export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  // スキルくん：敵がいれば無条件で突進、いなければ敵城へ
  var targetX = self.position.x;
  var targetY = self.position.y;

  if (enemies.length > 0) {
    var nearest = utils.findNearest(self, enemies);
    targetX = nearest.position.x;
    targetY = nearest.position.y;
  } else if (enemyCastle) {
    targetX = enemyCastle.x;
    targetY = enemyCastle.y;
  }

  return { x: targetX, y: targetY };
}

// 攻撃対象と方法を決める（射程内の敵がいれば最初の1体を通常攻撃）
export function attack(turn, inRangeEnemies, self) {
  // スキルくん：射程内の敵がいれば、スキル使用可能ならスキル攻撃、使用済みなら通常攻撃
  if (inRangeEnemies.length > 0) {
    if( utils.hasUsedSkill(self) == false ) {
      // スキル使用可能なら最初の敵にスキル攻撃
      return { target: inRangeEnemies[0], method: "skill" };
    } else {
      // スキル使用済みなら通常攻撃
      var target = inRangeEnemies[0];
      return { target: target, method: "normal" };
    }
  }
  return null;
}