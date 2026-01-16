
// メイジ: エレメンタルバースト（半径2マスに5秒間継続ダメージ 総計250%）
import { queueEffect } from '../actions.js';
import { computeDamage,getAttackableEnemies } from '../rules.js';

const SKILL_RANGE = 2; // 2マス分のピクセル距離

export function processSkill(state, unit) {
  // mageSkillTurns の減算（描画用）
  if (unit?.memory?.mageSkillTurns && unit.memory.mageSkillTurns > 0) {
    unit.memory.mageSkillTurns--;
    if (unit.memory.mageSkillTurns <= 0) delete unit.memory.mageSkillTurns;
  }
  if (unit.hp <= 0) {
    if (unit.memory.mageDot) {
      unit.memory.mageDot.turns = 0;
      delete unit.memory.mageDot;
      state.log.push({ turn: state.turn, message: `${unit.name}のエレメンタルバースト効果が死亡により即時終了。` });
    }
    return;
  }
  // 継続ダメージ処理
  if (unit.memory.mageDot && unit.memory.mageDot.turns > 0) {
    elementalBurstEffect(state, unit);
    if (unit.memory.mageDot.turns <= 0) {
      delete unit.memory.mageDot;
      state.log.push({ turn: state.turn, message: `${unit.name}のエレメンタルバースト効果が終了した。` });
    }
  }
}

export function doSkill(state, unit, targets) {
  // スキル発動時: 3ターン継続ダメージ情報をmemoryにセット
  unit.memory.mageDot = {
    turns: 3,
    position: { ...unit.position }
  };
  // mage 自身のスキル表示管理（継続中表示）
  if (!unit.memory) unit.memory = {};
  unit.memory.mageSkillTurns = 3;
  queueEffect(state, {
    kind: 'skill',
    position: unit.position,
    source: unit.position,
    variant: 'elementalBurst',
    sound: 'mage_skill',
    jobSounds: [{ job: 'mage', kind: 'skill' }],
    durationMs: 1200,
    job: unit.job
  });
  elementalBurstEffect(state, unit);
  state.log.push({ turn: state.turn, message: `${unit.name}はエレメンタルバースト！（半径2マス・3ターン継続ダメージ）` });
}

function elementalBurstEffect(state, unit) {
  // 毎ターンmagefireエフェクト（周囲2タイル分）
  queueMagefireEffects(state, unit.position);

  // 毎ターン、mageDot.positionを最新のunit.positionに更新（magefireが移動に追従）
  unit.memory.mageDot.position = { ...unit.position };
  const center = unit.memory.mageDot.position;
  // 2タイル分のピクセル距離
  const range = SKILL_RANGE;
  // 攻撃力20の仮想ユニット
  const dotUnit = {
    ...unit,
    stats: { ...unit.stats, attack: 20 }
  };
  const targets = getAttackableEnemies(state, unit, range);
  targets.forEach(target => {
    const damage = computeDamage(dotUnit, target);
    target.hp = Math.max(0, target.hp - damage);
    queueEffect(state, {
      kind: 'attack',
      position: target.position,
      source: center,
      target: target.position,
      variant: 'magic',
      sound: 'mage_skill',
      jobSounds: [{ job: 'mage', kind: 'skill' }],
      impactLabel: `${damage}`,
        job: unit.job,
        skill: 'target'
    });
    state.log.push({ turn: state.turn, message: `${unit.name}のエレメンタルバースト継続ダメージ → ${target.name}に${damage}ダメージ` });
  });
  unit.memory.mageDot.turns--;
}

export function getSprite(unit) {
  try {
    if (unit && unit.memory && ((unit.memory.mageDot && unit.memory.mageDot.turns > 0) || (unit.memory.mageSkillTurns && unit.memory.mageSkillTurns > 0))) return `job_mage_skill`;
  } catch (e) {}
  return `job_mage`;
}

// mageの周囲2タイル分にmagefireエフェクトを追加
function queueMagefireEffects(state, center) {
  const offsets = [];
  const range = SKILL_RANGE;
  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      if (Math.sqrt(dx * dx + dy * dy) > range) continue;
      if (dx === 0 && dy === 0) continue; // 中心は除外
      offsets.push({ x: dx, y: dy });
    }
  }
  offsets.forEach(offset => {
    queueEffect(state, {
      kind: 'magefire',
      position: { x: center.x + offset.x, y: center.y + offset.y },
      image: 'map/magefire.png',
      durationMs: 1200,
      job: 'mage'
    });
  });
}