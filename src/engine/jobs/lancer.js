// ランサー: リーチブレイク（縦列4マス貫通攻撃＋ノックバック）
import { queueEffect } from '../actions.js';
import { computeDamage, isInRange, getAttackableEnemies } from '../rules.js';
const SKILL_RANGE = 10; // 10マス分のピクセル距離

export function processSkill(state, unit) {
  // 瞬間スキル表示ターンを減らす
  if (unit?.memory?.lancerSkillTurns && unit.memory.lancerSkillTurns > 0) {
    unit.memory.lancerSkillTurns--;
    if (unit.memory.lancerSkillTurns <= 0) delete unit.memory.lancerSkillTurns;
  }
}


export function doSkill(state, unit, targets) {
  // 新仕様: 縦横4マスにいる敵すべてに攻撃
  const center = unit.position;
  // 10タイル分のピクセル距離
  const range = SKILL_RANGE;
  const areaTargets = getAttackableEnemies(state, unit, range);
  
  if (areaTargets.length === 0) return;
  if (!unit.memory) unit.memory = {};
  unit.memory.lancerSkillTurns = 1;
  console.log("Lancer Skill Targets:", areaTargets);
  areaTargets.forEach(target => {
    // areaTargets は getAttackableEnemies(state, unit, range) で
    // 既に拡張レンジでフィルタ済みなので、ここで通常射程の isInRange を
    // 再度チェックすると、範囲外の敵が弾かれてしまいます。
    // そのためチェックは不要。対象にダメージを適用する。
    target.memory.reachBreakHit = true;
    const damage = computeDamage(unit, target);
    target.hp = Math.max(0, target.hp - damage);
    state.log.push({ turn: state.turn, message: `Lancer Skill hits ${unit.name} が ${target.name} に ${damage} ダメージ` });
    //console.log(`Lancer Skill hits ${target.name} for ${damage} damage.`);
    queueEffect(state, {
      kind: 'attack',
      position: target.position,
      source: unit.position,
      target: target.position,
      variant: 'pierce',
      sound: 'lancer_skill',
      jobSounds: [{ job: 'lancer', kind: 'skill' }],
      impactLabel: `${damage}`,
      job: unit.job,
      skill: 'target'
    });
  });
  queueEffect(state, {
    kind: 'skill',
    position: unit.position,
    source: unit.position,
    variant: 'reachBreak',
    sound: 'lancer_skill',
    jobSounds: [{ job: 'lancer', kind: 'skill' }],
    durationMs: 800,
    job: unit.job,
    skill: 'self'
  });
  state.log.push({ turn: state.turn, message: `${unit.name}はリーチブレイク！（縦横10マス範囲攻撃）` });
}

export function getSprite(unit) {
  try {
    if (unit && unit.memory && unit.memory.lancerSkillTurns && unit.memory.lancerSkillTurns > 0) return `job_lancer_skill`;
  } catch (e) {}
  return `job_lancer`;
}
