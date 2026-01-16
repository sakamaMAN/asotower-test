import * as Guardian from './guardian.js';
import * as Healer from './healer.js';
import * as Soldier from './soldier.js';
import * as Lancer from './lancer.js';
import * as Archer from './archer.js';
import * as Mage from './mage.js';
import * as Assassin from './assassin.js';
import * as Engineer from './engineer.js';
import * as Summoner from './summoner.js';
import * as Scout from './scout.js';
import * as Sumo from './sumo.js';

export const jobsMap = {
  guardian: Guardian,
  healer: Healer,
  soldier: Soldier,
  lancer: Lancer,
  archer: Archer,
  mage: Mage,
  assassin: Assassin,
  engineer: Engineer,
  summoner: Summoner,
  scout: Scout,
  sumo: Sumo
};

// ユニットに描画するスプライトのキーを返すヘルパー
// 各ジョブモジュールが getSprite(unit) をエクスポートしていればそれを使う。
export function getSprite(unit) {
  if (!unit || !unit.job) return null;
  const mod = jobsMap[unit.job];
  if (mod && typeof mod.getSprite === 'function') {
    try {
      return mod.getSprite(unit);
    } catch (e) {
      console.warn('job.getSprite error for', unit.job, e);
    }
  }
  return `job_${unit.job}`;
}
