export function processSkill(state, unit) {
  // 瞬間スキル表示ターンを減らす
  if (unit?.memory?.assassinSkillTurns && unit.memory.assassinSkillTurns > 0) {
    unit.memory.assassinSkillTurns--;
    if (unit.memory.assassinSkillTurns <= 0) delete unit.memory.assassinSkillTurns;
  }
}

// アサシン: シャドウステップ（瞬時に2マス移動＋背後200%ダメージ）
import { queueEffect } from '../actions.js';
import { computeDamage } from '../rules.js';

export function doSkill(state, unit, target) {
  if (!unit.memory) unit.memory = {};
  unit.memory.assassinSkillTurns = 1;
  unit.memory.shadowStep = true;
  // 背後2マス移動（仮: targetの背後方向）
  if (target) {
    const dx = target.position.x - unit.position.x;
    const dy = target.position.y - unit.position.y;
    const dist = Math.hypot(dx, dy) || 1;
    unit.position.x = target.position.x + dx / dist * 2;
    unit.position.y = target.position.y + dy / dist * 2;
    queueEffect(state, {
      kind: 'move',
      position: unit.position,
      source: unit.position,
      variant: 'shadowStep',
      sound: 'assassin_skill',
      jobSounds: [{ job: 'assassin', kind: 'skill' }],
      durationMs: 600,
      skill: 'self',
      job: unit.job
    });
    // 200%ダメージ計算・HP減少（通常攻撃ベース）
    const damage = Math.floor(computeDamage(unit, target) * 2.0);
    target.hp = Math.max(0, target.hp - damage);
    queueEffect(state, {
      kind: 'attack',
      position: target.position,
      source: unit.position,
      target: target.position,
      variant: 'critical',
      sound: 'assassin_skill',
      jobSounds: [{ job: 'assassin', kind: 'skill' }],
      impactLabel: `${damage}`,
      job: unit.job,
      skill: 'target'
    });
    state.log.push({ turn: state.turn, message: `${unit.name}はシャドウステップ！（背後2マス移動＋${damage}ダメージ）` });
  }
}

export function getSprite(unit) {
  try {
    if (unit && unit.memory && unit.memory.assassinSkillTurns && unit.memory.assassinSkillTurns > 0) return `job_assassin_skill`;
  } catch (e) {}
  return `job_assassin`;
}
