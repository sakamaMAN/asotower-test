export function processSkill(state, unit) {
  // 瞬間スキル表示ターンを減らす
  if (unit?.memory?.healerSkillTurns && unit.memory.healerSkillTurns > 0) {
    unit.memory.healerSkillTurns--;
    if (unit.memory.healerSkillTurns <= 0) delete unit.memory.healerSkillTurns;
  }
}

// ヒーラー: メディカ（味方1体即時150回復＋弱体解除）
import { queueEffect } from '../actions.js';

export function doSkill(state, unit, target) {
  // 味方全員を即時20回復
  // NOTE: state units use `side` ("west"/"east") not `team`. 使用プロパティの誤りで敵味方両方に適用されていたため修正。
  if (!unit.memory) unit.memory = {};
  unit.memory.healerSkillTurns = 1;
  const allies = state.units.filter(u => u.side === unit.side && u.hp > 0);
  allies.forEach(target => {
    const before = target.hp;
    target.hp = Math.min(target.stats.hp, target.hp + 20);
    // 通常回復エフェクト
    queueEffect(state, {
      kind: 'heal',
      position: target.position,
      source: unit.position,
      target: target.position,
      variant: 'medica',
      sound: 'healer_skill',
      jobSounds: [{ job: 'healer', kind: 'skill' }],
      impactLabel: `+${target.hp - before}`,
      job: unit.job,
      skill: 'target'
    });
    // 白い光で包むスペシャルエフェクト＋super_healサウンド
    queueEffect(state, {
      kind: 'heal_special',
      position: target.position,
      source: unit.position,
      target: target.position,
      variant: 'medica_all',
      job: unit.job,
      durationMs: 700,
      sound: 'super_heal',
      skill: 'target'
    });
  });
  state.log.push({ turn: state.turn, message: `${unit.name}は味方全員をメディカ！（全員20回復）` });
}

export function getSprite(unit) {
  try {
    if (unit && unit.memory && unit.memory.healerSkillTurns && unit.memory.healerSkillTurns > 0) return `job_healer_skill`;
  } catch (e) {}
  return `job_healer`;
}
