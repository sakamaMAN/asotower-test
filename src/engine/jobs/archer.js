export function processSkill(state, unit) {
  // 瞬間スキル表示ターンを減らす
  if (unit?.memory?.archerSkillTurns && unit.memory.archerSkillTurns > 0) {
    unit.memory.archerSkillTurns--;
    if (unit.memory.archerSkillTurns <= 0) delete unit.memory.archerSkillTurns;
  }
}

// アーチャー: マルチショット（扇状に3本の矢を放ち、それぞれ70%威力）
import { queueEffect } from '../actions.js';
import { computeDamage,getAttackableEnemies } from '../rules.js';

export function doSkill(state, unit, target) {
  // targetsは射程内の敵すべて
  const targets = getAttackableEnemies(state, unit);
  if (targets.length === 0) {
    console.log("アーチャー: マルチショット発動失敗（射程内に敵なし）");
    return;
  }
  // 瞬間スキル表示用フラグ（1ターン分）
  if (!unit.memory) unit.memory = {};
  unit.memory.archerSkillTurns = 1;
  targets.forEach(t => {
    const damage = Math.floor(computeDamage(unit, t) * 0.7);
    t.hp = Math.max(0, t.hp - damage);
    state.log.push({ turn: state.turn, message: `${unit.name}のマルチショット → ${t.name}に${damage}ダメージ` });
    queueEffect(state, {
      kind: 'attack',
      position: t.position,
      source: unit.position,
      target: t.position,
      variant: 'multiShot',
      sound: 'archer_skill',
      jobSounds: [{ job: 'archer', kind: 'skill' }],
      impactLabel: `${damage}`,
      job: unit.job,
      skill: 'target'
    });
  });
  console.log("アーチャー: マルチショット（射程内の敵、それぞれ70%威力）");
  queueEffect(state, {
    kind: 'skill',
    position: unit.position,
    source: unit.position,
    variant: 'multiShot',
    sound: 'archer_skill',
    jobSounds: [{ job: 'archer', kind: 'skill' }],
    durationMs: 800,
    job: unit.job,
    skill: 'self'
  });
  state.log.push({ turn: state.turn, message: `${unit.name}はマルチショットを放った！（射程内の敵に各70%威力）` });
}

export function getSprite(unit) {
  try {
    if (unit && unit.memory && unit.memory.archerSkillTurns && unit.memory.archerSkillTurns > 0) return `job_archer_skill`;
  } catch (e) {}
  return `job_archer`;
}
