import * as utils from "../../shared/unit-utils.js";

export function init() {
  return {
    job: "healer",
    name: "癒しさん",
    initialPosition: {
      relativeTo: "allyCastle",
      x: 1,
      y: 0
    },
    bonus: { attack: 0, defense: 0, speed: 0, range: 10, hp: 0 }, // 合計10
  };
}

// どこに移動するか決める（最も近い敵がいればその座標、いなければ敵城）
export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  //動かない
  var targetX = self.position.x;
  var targetY = self.position.y;

  return { x: targetX, y: targetY };
}

// 攻撃対象と方法を決める（射程内の敵がいれば最初の1体を通常攻撃）
export function attack(turn, inRangeEnemies, self) {
    //傷ついているが味方がいれば回復する
    const getDamagedAllies = utils.getDamagedAllies(self);
    
    if( getDamagedAllies.length > 0 && utils.hasUsedSkill(self) === false){
      var target = getDamagedAllies[0];
      return { target: target, method: "skill" };
    }else if (inRangeEnemies.length > 0) {
      var target = inRangeEnemies[0];
      return { target: target, method: "normal" };
    }

  return null;
}