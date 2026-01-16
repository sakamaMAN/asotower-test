export function processSkill(state, unit) {
  // 瞬間スキル表示ターンを減らす
  if (unit?.memory?.sumoSkillTurns && unit.memory.sumoSkillTurns > 0) {
    unit.memory.sumoSkillTurns--;
    if (unit.memory.sumoSkillTurns <= 0) delete unit.memory.sumoSkillTurns;
  }
}

// 相撲レスラー: 土俵轟砕（半径1.5マス体当たり・250%攻撃＋ノックバック2マス・8秒間被ダメ-30%）
import { queueEffect } from '../actions.js';
import { getAttackableEnemies, computeDamage } from '../rules.js';
export function doSkill(state, unit, targets) {
  // 半径2マス（ピクセル換算）範囲内の敵全体に攻撃
  // range はタイル単位で指定する（getAttackableEnemies は位置をタイル単位で扱う）
  const range = 2; // 半径2マス（タイル単位）
  // 自軍城の位置
  const castle = state.map?.castles?.[unit.side];
  const targetsInRange = getAttackableEnemies(state, unit, range);
  if (targetsInRange.length === 0) return;
  targetsInRange.forEach(target => {
    // ダメージ計算（100%）
    const damage = computeDamage(unit, target);
    target.hp = Math.max(0, target.hp - damage);
    // ノックバック方向（自軍城と逆方向に4マス）
    let dx = 0, dy = 0;
    if (castle) {
      dx = target.position.x - castle.x;
      dy = target.position.y - castle.y;
      const len = Math.hypot(dx, dy) || 1;
      dx = dx / len;
      dy = dy / len;
    }
  // 逆方向に4マス分移動（タイル単位）。小数になる可能性があるため四捨五入し、
  // マップ外にはみ出さないようにクリップする。
  const knockbackTiles = 4;
  const nx = Math.round(dx * knockbackTiles);
  const ny = Math.round(dy * knockbackTiles);
  target.position.x = Math.max(0, Math.min((state.map?.width || 0) - 1, target.position.x + nx));
  target.position.y = Math.max(0, Math.min((state.map?.height || 0) - 1, target.position.y + ny));
    queueEffect(state, {
      kind: 'attack',
      position: target.position,
      source: unit.position,
      target: target.position,
      variant: 'bodySlam',
      sound: 'sumo_skill',
      jobSounds: [{ job: 'sumo', kind: 'skill' }],
      impactLabel: `${damage}`,
      job: unit.job,
      skill: 'target'
    });
    queueEffect(state, {
      kind: 'knockback',
      position: target.position,
      source: unit.position,
      target: target.position,
      variant: 'knockback',
      sound: 'sumo_skill',
      jobSounds: [{ job: 'sumo', kind: 'skill' }],
      durationMs: 600,
      job: unit.job,
      skill: 'target'
    });
  });
  if (!unit.memory) unit.memory = {};
  unit.memory.sumoSkillTurns = 1;
  queueEffect(state, {
    kind: 'skill',
    position: unit.position,
    source: unit.position,
    variant: 'bodySlam',
    sound: 'sumo_skill',
    jobSounds: [{ job: 'sumo', kind: 'skill' }],
    durationMs: 800,
    job: unit.job,
    skill: 'self'
  });
  state.log.push({ turn: state.turn, message: `${unit.name}は土俵轟砕！（半径2マス範囲攻撃＋ノックバック4マス）` });
}

export function getSprite(unit) {
  try {
    if (unit && unit.memory && unit.memory.sumoSkillTurns && unit.memory.sumoSkillTurns > 0) return `job_sumo_skill`;
  } catch (e) {}
  return `job_sumo`;
}
