// サモナー: ミニオンコール（HP40攻撃10のミニオン3体を20秒間召喚）
import { queueEffect } from '../actions.js';
import * as uutils from '../../shared/unit-utils.js';

// チャンピオン消滅共通処理
function vanishChampion(state, champ, reason = 'killed') {
  if (!champ) return;
  console.log(`vanishChampion: Vanishing champion ${champ.name || champ.id} reason=${reason}`);
  // 既に消滅処理済みなら再度エフェクトを流さない
  if (champ.memory?.vanished) return;

  // reason によってサウンドや jobSounds を分ける（期限切れはdown音を鳴らさない）
  const isKilled = reason === 'killed' || reason === 'ownerDead';
  queueEffect(state, {
    kind: 'smoke',
    position: champ.position,
    source: champ.position,
    variant: isKilled ? 'disappear' : 'expire',
    sound: isKilled ? 'monster_down' : 'monster_expire',
    jobSounds: isKilled ? [{ job: 'monster', kind: 'down' }] : [],
    durationMs: 800,
    job: 'monster'
  });
  champ.hp = 0;
  // 消滅フラグを立て、summonedChampion 情報が残っていれば削除する
  if (!champ.memory) champ.memory = {};
  delete champ.memory.summonedChampion;
  champ.memory.vanished = true;
}

// チャンピオンを通常ユニットと同じように扱うため、簡易AIモジュールを付与する。
// moveTo: 敵がいれば最寄りの敵へ、いなければ敵城へ移動
// attack: 射程内の敵がいれば通常攻撃を返す
// ヘルパーを使って見通し良くする
function chooseChampionMoveTarget(enemies, enemyCastle, self) {
  if (enemies && enemies.length > 0) {
    const nearest = uutils.findNearest(self, enemies);
    if (nearest) return { x: nearest.position.x, y: nearest.position.y };
  }
  const castlePos = uutils.getEnemyCastlePosition(self) || enemyCastle;
  if (castlePos) return { x: castlePos.x, y: castlePos.y };
  return { x: self.position.x, y: self.position.y };
}

function chooseChampionAttackTarget(inRangeEnemies, self) {
  if (!inRangeEnemies || inRangeEnemies.length === 0) return null;
  const nearest = uutils.findNearest(self, inRangeEnemies);
  return nearest ? { target: nearest, method: 'normal' } : null;
}

export function doSkill(state, unit, target) {
  // 既に召喚済みなら何もしない
  if (unit.memory.summonedChampion) return;

  // 進行方向（仮: x+1）に召喚
  const summonPos = { x: unit.position.x + 1, y: unit.position.y };
  const champion = {
    id: `champion_${unit.id}_${state.turn}`,
    name: 'チャンピオン',
    job: 'monster',
    side: unit.side,
    position: { ...summonPos },
    stats: {
      hp: 100,
      attack: 40,
      speed: 30,
      range: 30,
      defense: 40
    },
    hp: 100,
    // summonedChampion.turns は残存ターン数（生成直後を含め5ターン分稼働させたい）
    // owner を入れて誰が管理しているかを明示する
    memory: { summonedChampion: { turns: 5, owner: unit.id } , vanished: false }
  };

  champion.module = {
    moveTo(turn, enemies, allies, enemyCastle, allyCastle, self) {
      return chooseChampionMoveTarget(enemies, enemyCastle, self);
    },
    attack(turn, inRangeEnemies, self) {
      return chooseChampionAttackTarget(inRangeEnemies, self);
    }
  };
  state.units.push(champion);
  unit.memory.summonedChampion = champion.id;
  if (!unit.memory) unit.memory = {};
  unit.memory.summonerSkillTurns = 1;
  queueEffect(state, {
    kind: 'summon',
    position: champion.position,
    source: unit.position,
    variant: 'monster',
    sound: 'summoner_skill',
    jobSounds: [{ job: 'summoner', kind: 'skill' }],
    durationMs: 1200,
    job: unit.job,
    skill: 'self'
  });
  state.log.push({ turn: state.turn, message: `${unit.name}はチャンピオンを召喚！（5ターン限定・HP15攻撃35）` });
}
export function processSkill(state, unit) {
  // 減算：召喚スキルの一時表示ターン
  if (unit?.memory?.summonerSkillTurns && unit.memory.summonerSkillTurns > 0) {
    unit.memory.summonerSkillTurns--;
    if (unit.memory.summonerSkillTurns <= 0) delete unit.memory.summonerSkillTurns;
  }
  if (unit.hp <= 0) {
    // サモナー自身の死亡時は召喚効果を即時終了
    if (unit.memory.summonedChampion) {
      // 召喚したチャンピオンを探して消す
      const champId = unit.memory.summonedChampion;
      const champ = state.units.find(u => u.id === champId);
      if (champ) {
        //console.log(`unit.hp <= 0: Vanishing champion ${champ.name || champ.id} because summoner ${unit.name || unit.id} died`);
        vanishChampion(state, champ);
      }
      delete unit.memory.summonedChampion;
      state.log.push({ turn: state.turn, message: `${unit.name}の召喚効果が死亡により即時終了。` });
    }
    return;
  }
  // チャンピオン消滅・AI攻撃処理
  // この関数は各ユニットごとに呼ばれるため、召喚のターン減算は召喚元（summoner）だけが行うようにする。
  if (unit.memory?.summonedChampion) {
    const champId = unit.memory.summonedChampion;
    const champ = state.units.find(u => u.id === champId);
    if (champ && !champ.memory?.vanished) {
      // オーナー一致確認（念のため）- champ の memory.summonedChampion.owner が現在の unit.id と一致する場合のみ減算する
      const ownerId = champ.memory?.summonedChampion?.owner;
      if (ownerId && ownerId !== unit.id) {
        // 参照ミスマッチがあれば警告（通常は起きない）。この場合は減算しない。
        console.log(`processSkill warning: champ ${champ.id} owner mismatch: expected ${ownerId} but triggered by ${unit.id}`);
        return;
      }
      // ターン減算（owner が一致するか owner が未設定の場合のみ）
      if (champ.memory?.summonedChampion && typeof champ.memory.summonedChampion.turns === 'number') {
        champ.memory.summonedChampion.turns--;
      }
      // 消滅条件
      const turnsLeft = champ.memory?.summonedChampion?.turns ?? 0;
      if (turnsLeft <= 0 || champ.hp <= 0) {
        const expired = turnsLeft <= 0 && champ.hp > 0;
        //console.log(`processSkill: Vanishing champion ${champ.name || champ.id} because turns ${turnsLeft} or hp ${champ.hp} (expired=${expired})`);
        vanishChampion(state, champ, expired ? 'timeout' : 'killed');
        state.log.push({ turn: state.turn, message: expired ? `チャンピオンの召喚時間が終了した。` : `チャンピオンは煙とともに消えた。` });
        // 召喚者側の参照も削除（参照が一致する場合のみ）
        if (unit.memory.summonedChampion === champ.id) delete unit.memory.summonedChampion;
      }
    }
  }
}

export function getSprite(unit) {
  try {
    if (unit && unit.memory && unit.memory.summonerSkillTurns && unit.memory.summonerSkillTurns > 0) return `job_summoner_skill`;
  } catch (e) {}
  return `job_summoner`;
}
