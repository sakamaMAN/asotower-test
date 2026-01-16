export function processSkill(state, unit) {
  // 防御バフの残りターンを管理
  if (unit.memory.guardBuffTurns && unit.memory.guardBuffTurns > 0) {
    unit.memory.guardBuffTurns--;
    if (unit.memory.guardBuffTurns === 0) {
      // バフ終了時に防御力を元に戻す
      if (unit.memory.originalDefense != null) {
        unit.stats.defense = unit.memory.originalDefense;
        delete unit.memory.originalDefense;
      }
      state.log.push({ turn: state.turn, message: `${unit.name}の防御バフが終了した。` });
    }
  }
}

// ガーディアン: フォートレス（8秒間被ダメ-40%＋ヘイト上昇）
import { queueEffect } from '../actions.js';

export function doSkill(state, unit, target) {
  // 4ターン防御力1.4倍バフ
  unit.memory.guardBuffTurns = 5;
  unit.memory.originalDefense = unit.stats.defense;
  unit.stats.defense = Math.floor(unit.stats.defense * 1.4);
  queueEffect(state, {
    kind: 'buff',
    position: unit.position,
    source: unit.position,
    variant: 'fortress',
    sound: 'guardian_skill',
    jobSounds: [{ job: 'guardian', kind: 'skill' }],
    durationMs: 800,
    job: unit.job,
    skill: 'self'
  });
  state.log.push({ turn: state.turn, message: `${unit.name}はフォートレス！（4ターン防御力1.4倍）` });
}

export function getSprite(unit) {
  try {
    if (unit && unit.memory && unit.memory.guardBuffTurns && unit.memory.guardBuffTurns > 0) return `job_guardian_skill`;
  } catch (e) {}
  return `job_guardian`;
}
