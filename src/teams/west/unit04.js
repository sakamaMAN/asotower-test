import * as utils from "../../shared/unit-utils.js";

export function init() {
  return {
    job: "guardian",
    name: "とにかく横",
    initialPosition: {
      relativeTo: "allyCastle",
      x: 9,
      y: 2
    },
    bonus: { atk: 3, def: 2, spd: 2, hit: 2, hp: 1 }, // 合計10
  };
}

// どこに移動するか決める（最も近い敵がいればその座標、いなければ敵城）
export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  //とにかく横に移動する
  var targetX = enemyCastle.x;
  var targetY = self.position.y;

  return { x: targetX, y: targetY };
}

// 攻撃対象と方法を決める（射程内の敵がいれば最初の1体を通常攻撃）
export function attack(turn, inRangeEnemies, self) {
  // 城突撃隊：敵城が射程内なら攻撃、いなければ射程内の敵を通常攻撃
  if( utils.isEnemyCastleInRange(self)){
    return { target: target, method: "attackCastle" };
  }else if (inRangeEnemies.length > 0) {
      var target = inRangeEnemies[0];
      return { target: target, method: "normal" };
  }
  return null;
}