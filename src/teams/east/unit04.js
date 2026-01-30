import * as utils from "../../shared/unit-utils.js";

export function init() {
  return {
    job: "assassin",
    name: "asa1",
    initialPosition: {
      relativeTo: "allyCastle",
      x: 12,
      y: 2
    },
    bonus: { attack: 8, defense: 2, speed: 0, range: 0, hp: 0 }, // 合計10
  };
}

// どこに移動するか決める（最も近い敵がいればその座標、いなければ敵城）
export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
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
  console.log("InRangeEnemies:", inRangeEnemies.map(e => e.name),"unitrange:",self.stats.range);
  if (inRangeEnemies.length > 0) {
    //最も近い敵を取得
    var target = utils.findNearest(self, inRangeEnemies);
    
    if(utils.hasUsedSkill(self) == false ){      
      return { target: target, method: "skill" };
    }else{
      return { target: target, method: "normal" };
    }
  }
  return null;
}