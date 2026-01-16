// 攻撃可能な敵ユニット一覧を取得（ステルス除外、範囲指定可）
export function getAttackableEnemies(state, unit, range = null) {
  const effectiveRange = range !== null ? range : rangePerTurn(unit);
  return state.units.filter(target => {
    if (target.side === unit.side) return false;
    if (target.hp <= 0) return false;
    if (target.memory?.stealth?.turns > 0) return false;
    // 射程判定
    const dx = target.position.x - unit.position.x;
    const dy = target.position.y - unit.position.y;
    if (Math.sqrt(dx * dx + dy * dy) > effectiveRange) return false;
    return true;
  });
}
import { JOB_DATA } from "../data/jobs.js?v=202510231119";

export function computeDamage(attacker, defender) {
  const attack = Number(attacker?.stats?.attack) || 0;
  const defense = Number(defender?.stats?.defense) || 0;

  // 基本ダメージ（浮動小数）
  let dmg = attack - defense * 0.5;

  // ジョブ相性補正（攻撃側の有利・防御側の脆弱性など）
  const attJob = JOB_DATA[attacker.job];
  const defJob = JOB_DATA[defender.job];
  if (attJob?.affinity?.attack === defender.job) {
    dmg *= 1.2;
  }
  if (defJob?.affinity?.vulnerable === attacker.job) {
    dmg *= 1.5;
  }

  // ランダムゆらぎ（±5%程度）
  const jitter = 0.95 + Math.random() * 0.1;
  dmg *= jitter;

  // クリティカル
  const critChance = 0.05;
  if (Math.random() < critChance) {
    dmg *= 1.5;
  }

  // 最終的に整数化して最低1を保証する（攻撃が発生したら0は返さない）
  const final = Math.round(dmg);
  return Math.max(1, final);
}

export function movementPerTurn(unit) {
  return unit.stats.speed / 10;
}

export function isInRange(attacker, target) {
  // getAttackableEnemiesを使って判定
  const targets = getAttackableEnemies({ units: [target] }, attacker);
  return targets.length > 0;
}

export function rangePerTurn(unit) {
  // タイル数で返す（ピクセル換算はisInRange側で行う）
  return unit.stats.range / 10;
}