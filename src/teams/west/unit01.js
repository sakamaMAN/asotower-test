import * as utils from "../../shared/unit-utils.js";

// 汎用最強 - 第1タンク（防御壁）
export function init() {
  return {
    job: "guardian",
    name: "鉄壁・雷電",
    initialPosition: {
      relativeTo: "allyCastle",
      x: 13,
      y: 1
    },
    bonus: { atk: 0, def: 6, spd: 0, hit: 0, hp: 4 }, // 防御最優先
  };
}

// 最前線で敵を引きつける、敵が少なければ城へ
export function moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
  // 前衛が離れすぎていれば合流する
  if (allies.length > 0) {
    var anchor = utils.findNearest(self, allies);
    if (anchor && anchor.id !== self.id) {
      var distToAnchor = utils.distanceBetween(self.position, anchor.position);
      if (distToAnchor > 8) {
        return { x: anchor.position.x, y: anchor.position.y };
      }
    }
  }

  if (enemies.length > 0) {
    var nearest = utils.findNearest(self, enemies);
    return { x: nearest.position.x, y: nearest.position.y };
  }
  return { x: enemyCastle.x, y: enemyCastle.y };
}

// フォートレスで防御を上げつつ前線維持
export function attack(turn, inRangeEnemies, self) {
  // 敵が射程内にいない場合のみ城を攻撃
  if (inRangeEnemies.length === 0 && utils.isEnemyCastleInRange(self)) {
    return { target: null, method: "attackCastle" };
  }

  if (inRangeEnemies.length > 0) {
    var target = utils.findNearest(self, inRangeEnemies);

    // 複数の敵がいればスキルで範囲攻撃＋押し戻し
    if (!utils.hasUsedSkill(self)) {
      return { target: target, method: "skill" };
    }
    return { target: target, method: "normal" };
  }
  return null;
}
