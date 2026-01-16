import * as utils from "../../shared/unit-utils.js";

// 2点間の直線上セルリスト（整数座標）を返す（Bresenhamアルゴリズム簡易版）
function getLinePositions(from, to) {
  const positions = [];
  const x0 = Math.floor(from.x), y0 = Math.floor(from.y);
  const x1 = Math.floor(to.x), y1 = Math.floor(to.y);
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0, y = y0;
  while (true) {
    positions.push({ x, y });
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
  return positions;
}

// 直線上で最初に出会う敵セルを返す（味方は無視）
function findFirstEnemyOnLine(lineCells, enemies) {
  for (const cell of lineCells) {
    if (enemies.some(e => Math.floor(e.position.x) === cell.x && Math.floor(e.position.y) === cell.y)) {
      return cell;
    }
  }
  return null;
}

// 指定座標が埋まっている場合、ずらし候補を順に返す
function findAvailablePosition(state, basePos, self) {
  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 }
  ];
  let offset = 1;
  while (offset <= 5) { // 最大5マスまで探索
    for (const dir of directions) {
      const pos = { x: basePos.x + dir.dx * offset, y: basePos.y + dir.dy * offset };
      if (!isOccupiedCell(state, pos, self)) return pos;
    }
    offset++;
  }
  return basePos; // どこも空いてなければ元の位置
}
// getAttackableEnemiesはrules.jsからimport
import { movementPerTurn, computeDamage, isInRange, rangePerTurn, getAttackableEnemies } from "./rules.js";
import { jobsMap } from './jobs/index.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createTurnProcessor(state, config = {}) {
  pruneExpiredEffects(state);
  
  // 各ユニットのprocessSkillを毎ターン呼び出し
  for (const unit of state.units) {
    const jobHandler = jobsMap[unit.job];
    if (jobHandler && typeof jobHandler.processSkill === 'function') {
      jobHandler.processSkill(state, unit);
    }
  }
  const turnOrder = [...state.units].sort((a, b) => {
    const speedDiff = b.stats.speed - a.stats.speed;
    return speedDiff !== 0 ? speedDiff : a.slot - b.slot;
  });

  //state.log = [];

  let index = 0;

  return {
    async next() {
      while (index < turnOrder.length) {
        const unit = turnOrder[index++];
        if (unit.hp <= 0 || state.status.finished) continue;
        const module = unit.module;
        
        try {
          // --- 移動処理 ---
          moveTo(module, state, unit);
          // --- 攻撃処理 ---
          attack(module, state, unit);
        } catch (err) {
          state.log.push({
            turn: state.turn,
            message: `${unit.id} のユニットでエラー: ${err}`
          });
          continue;
        }

        return { unit };
      }
      return null;
    },
    finalize() {
      state.turn += 1;
      checkEndCondition(state,config);
    }
  };
}

function moveTo(module, state, unit) {
    if (typeof module.moveTo === 'function') {
      const moveTarget = module.moveTo(
        state.turn,
        state.units.filter(u => u.side !== unit.side && u.hp > 0 && !utils.isScoutInSkillMode(u)), // 敵
        state.units.filter(u => u.side === unit.side && u.id !== unit.id && u.hp > 0), // 味方
        state.map.castles[unit.side === 'west' ? 'east' : 'west'], // 敵城
        state.map.castles[unit.side], // 味方城
        unit // 自分
      );
      //console.log(`Moving unit: ${unit.name} to x=${moveTarget.x}, y=${moveTarget.y}`);
      executeCommand(state, unit, { type: 'move', x: moveTarget.x, y: moveTarget.y });
      
    }
}

function attack(module, state, unit) {
    if (typeof module.attack === 'function') {
      const attackable = getAttackableEnemies(state, unit);
      const attackResult = module.attack(state.turn, attackable, unit);
      if (attackResult && attackResult.target) {
        if (attackResult.method === 'skill') {
          //console.log(`Using skill for unit: ${unit.id} targetId=${attackResult.target.id}`);
          queueEffect(state, {
            kind: "skill",
            position: unit.position,
            jobSounds: [{ job: unit.job, kind: "skill" }],
            durationMs: 1200 // 音声長に合わせて調整
          });
          executeCommand(state, unit, { type: 'skill', targetId: attackResult.target.id });
          // 城攻撃AI分岐
        } else if (attackResult && attackResult.method === 'attackCastle') {
          executeCommand(state, unit, { type: 'attackCastle' });
        } else if (attackResult.method === 'normal') {
          executeCommand(state, unit, { type: 'attack', targetId: attackResult.target.id });
        } else if( 
          state.units.filter(u => u.side !== unit.side && u.hp > 0 && !utils.isScoutInSkillMode(u)).length == 0 ) {
          // 敵ユニットが存在しない場合、城を攻撃する
          executeCommand(state, unit, { type: 'attackCastle' });
        }
      } else if (utils.isEnemyCastleInRange(unit)) {
        //攻撃指定が無くて城が攻撃範囲にあれば城を攻撃する
        executeCommand(state, unit, { type: 'attackCastle' });
      }
    }
}

export async function resolveTurn(state, config = {}, hooks = {}) {
  const { onUnitProcessed } = hooks;
  const processor = createTurnProcessor(state, config);

  try {
    while (true) {
      const step = await processor.next();
      if (!step) break;
      if (typeof onUnitProcessed === "function") {
        await onUnitProcessed(step.unit, state);
      }
    }
  } finally {
    processor.finalize();
  }
}

function createStateView(state, unit) {
  const enemySide = unit.side === "west" ? "east" : "west";
  const castles = state.map.castles ?? {};
  return {
    self: unit,
    allies: state.units.filter((u) => u.side === unit.side && u.id !== unit.id && u.hp > 0),
  enemies: getAttackableEnemies(state, unit),
    map: state.map,
    turn: state.turn,
    log: state.log,
    memory: unit.memory,
    allyCastle: {
      side: unit.side,
      hp: castles[`${unit.side}Hp`] ?? 0,
      position: castles[unit.side] ? { ...castles[unit.side] } : null
    },
    enemyCastle: {
      side: enemySide,
      hp: castles[`${enemySide}Hp`] ?? 0,
      position: castles[enemySide] ? { ...castles[enemySide] } : null
    }
  };
}

function createApi() {
  return {
    actions: {
      moveToward: (x, y) => ({ type: "move", x, y }),
      attack: (target) => ({ type: "attack", targetId: target.id }),
      attackCastle: () => ({ type: "attackCastle" }),
      useSkill: (target) => ({ type: "skill", targetId: target?.id ?? null })
    },
    utils: {
      findClosest(list, origin) {
        let best = null;
        let bestDist = Infinity;
        for (const item of list) {
          const dx = item.position.x - origin.x;
          const dy = item.position.y - origin.y;
          const dist = dx * dx + dy * dy;
          if (dist < bestDist) {
            best = item;
            bestDist = dist;
          }
        }
        return best;
      },
      distance(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
      },
      inRange(self, enemy) {
        return isInRange(self, enemy);
      },
      stepToward(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.hypot(dx, dy) || 1;
        const step = { x: from.x + dx / length, y: from.y + dy / length };
        return step;
      },
      closestEnemy(view) {
  // view.enemiesは既にgetAttackableEnemies経由だが、念のため直接取得も可能
  return this.findClosest(getAttackableEnemies(view.state, view.self), view.self.position);
      },
      closestAlly(view) {
        return this.findClosest(view.allies ?? [], view.self.position);
      },
      distanceToEnemyCastle(view) {
        const castlePos = view.enemyCastle?.position;
        if (!castlePos) return Infinity;
        return this.distance(view.self.position, castlePos);
      },
      distanceToAllyCastle(view) {
        const castlePos = view.allyCastle?.position;
        if (!castlePos) return Infinity;
        return this.distance(view.self.position, castlePos);
      },
      distanceToClosestEnemy(view) {
        const target = this.closestEnemy(view);
        return target ? this.distance(view.self.position, target.position) : Infinity;
      },
      distanceToClosestAlly(view) {
        const target = this.closestAlly(view);
        return target ? this.distance(view.self.position, target.position) : Infinity;
      },
      remainingEnemies(view) {
        return view.enemies?.length ?? 0;
      },
      remainingAllies(view) {
        const allies = view.allies?.length ?? 0;
        return allies + (view.self?.hp > 0 ? 1 : 0);
      }
    }
  };
}

function executeCommand(state, unit, command) {
  if (!command) return;
  switch (command.type) {
    case "move":
      handleMove(state, unit, command);
      break;
    case "attack":
      handleAttack(state, unit, command);
      break;
    case "attackCastle":
      handleAttackCastle(state, unit);
      break;
    case "skill":
      handleSkill(state, unit, command);
      break;
    default:
      state.log.push({ turn: state.turn, message: `${unit.name} のコマンド不明` });
  }
}

function handleMove(state, unit, command) {
  const speed = movementPerTurn(unit);
  const dx = command.x - unit.position.x;
  const dy = command.y - unit.position.y;
  // Chebyshev distance: treat diagonal as cost 1 (grid-friendly)
  const distance = Math.max(Math.abs(dx), Math.abs(dy));
  //console.log(`handleMove: unit=${unit.name} from (${unit.position.x},${unit.position.y}) to (${command.x},${command.y}), distance=${distance}, speed=${speed}`);
  if (distance === 0) return;

  const scale = Math.min(1, speed / distance);
  //動きたくもspeedが低くてほとんど動けない場合の対策
  let deltaX = dx * scale;
  let deltaY = dy * scale;
  //どちらも０（動きたくても動けない）時は横に１マス動かす
  if( deltaX < 1 && deltaX > 0 ) deltaX = (unit.side === 'east' ? -1 : 1);
  const target = {
    x: unit.position.x + deltaX,
    y: unit.position.y + deltaY
  };
  //console.log(`Initial target before wall adjustment: x=${target.x}, y=${target.y}`);
  const adjusted = adjustForWalls(state.map, unit.position, target);
  const currentCell = {
    x: Math.floor(unit.position.x),
    y: Math.floor(unit.position.y)
  };
  // 目標セル（整数座標）
  let targetCell = { x: Math.floor(adjusted.x), y: Math.floor(adjusted.y) };

  // 敵の途中判定・占有判定は整数セルで行う
  let finalTargetCell = { ...targetCell };
  if (!utils.isScoutInSkillMode(unit)) {
    const lineCells = getLinePositions(unit.position, finalTargetCell);
    const enemies = state.units.filter(u => u.side !== unit.side && u.hp > 0);
    const firstEnemyCell = findFirstEnemyOnLine(lineCells, enemies);
    if (firstEnemyCell) {
      // 敵セルの手前に移動
      const idx = lineCells.findIndex(cell => cell.x === firstEnemyCell.x && cell.y === firstEnemyCell.y);
      if (idx > 0) {
        finalTargetCell = { x: lineCells[idx - 1].x, y: lineCells[idx - 1].y };
      } else {
        finalTargetCell = { x: Math.floor(unit.position.x), y: Math.floor(unit.position.y) };
      }
      //console.log("直線状に敵発見したので回り込みました:", firstEnemyCell," finalTargetCell:", finalTargetCell);
    }
    targetCell = finalTargetCell;
  }

  const enteringNewCell = currentCell.x !== targetCell.x || currentCell.y !== targetCell.y;

  // ずらし処理: 移動先が埋まっている場合はY-1→Y+1→X+1→X-1の順で空きセルを探す
  if (enteringNewCell && isOccupiedCell(state, targetCell, unit)) {
    //console.log("移動先が埋まっているためずらし処理を行います");
    targetCell = findAvailablePosition(state, targetCell, unit);
  }

  const orgpositon = { x: Math.floor(unit.position.x), y: Math.floor(unit.position.y) };
  unit.position.x = targetCell.x;
  unit.position.y = targetCell.y;

  state.log.push({ turn: state.turn, message: `${unit.name} が${orgpositon.x}, ${orgpositon.y}から${unit.position.x}, ${unit.position.y}へ移動` });
  queueEffect(state, {
    kind: "move",
    position: unit.position,
    sound: "move", // ←追加
    source: unit.position,
    durationMs: 800 // 任意
  });
}

function adjustForWalls(map, from, to) {
  const walls = map?.walls ?? [];
  if (!walls.length) return { ...to };

  const maxDelta = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  const steps = Math.max(1, Math.ceil(maxDelta * 5));
  let safe = { ...from };

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const point = {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t
    };
    if (isWallCell(walls, point)) {
      return safe;
    }
    safe = point;
  }

  return to;
}

function isWallCell(walls, point) {
  const cellX = Math.floor(point.x);
  const cellY = Math.floor(point.y);
  return walls.some((wall) => wall.x === cellX && wall.y === cellY);
}



function isOccupiedCell(state, position, self) {
  const cellX = Math.floor(position.x);
  const cellY = Math.floor(position.y);

  if (utils.isScoutInSkillMode(self)) {
    return false;
  }

  return state.units.some((unit) => {
    if (unit === self || unit.hp <= 0) return false;
    return Math.floor(unit.position.x) === cellX && Math.floor(unit.position.y) === cellY;
  });
}

function handleAttack(state, unit, command) {
  const target = state.units.find((u) => u.id === command.targetId);
  if (!target || target.hp <= 0) return;

  if (!isInRange(unit, target)) {
    state.log.push({ turn: state.turn, message: `${unit.name} の攻撃は届かなかった` });
    return;
  }

  const damage = computeDamage(unit, target);
  const prevHp = target.hp;
  target.hp = Math.max(0, target.hp - damage);
  //console.log(`${unit.name} attacks ${target.name} for ${damage} damage (HP: ${prevHp} -> ${target.hp})`);
  state.log.push({ turn: state.turn, message: `${unit.name} が ${target.name} に ${damage} ダメージ` });
  const jobSounds = [];
  if (damage > 0 && target.job) {
    jobSounds.push({ job: target.job, kind: "hit" });
    if (target.hp <= 0) {
      jobSounds.push({ job: target.job, kind: "down" });
    }
  }
  queueEffect(state, {
    kind: "attack",
    position: target.position,
    sound: "attack",
    jobSounds,
    source: unit.position,
    target: target.position,
    variant: distanceBetween(unit.position, target.position) <= 1.5 ? "melee" : "ranged",
    impactLabel: `${damage}`,
    job: unit.job, // 攻撃者のジョブ名を追加
    durationMs: 3000
  });


  // 攻撃中の表示切替用フラグ（レンダラーで参照）。duration に合わせて期限を設定する。
  if (!unit.memory) unit.memory = {};
  unit.memory.isAttackingUntil = Date.now() + 3000;

  queueEffect(state, {
    kind: "impactRing",
    position: target.position,
    durationMs: 500
  });
}

function handleAttackCastle(state, unit) {
  const enemySide = unit.side === "west" ? "east" : "west";
  const castles = state.map.castles ?? {};
  const castlePos = castles[enemySide];
  const hpKey = enemySide === "west" ? "westHp" : "eastHp";
  if (!castlePos || castles[hpKey] <= 0) return;

  const distance = Math.hypot(castlePos.x - unit.position.x, castlePos.y - unit.position.y);
  if (distance > rangePerTurn(unit)) {
    state.log.push({ turn: state.turn, message: `${unit.name} の攻撃は城に届かなかった` });
    return;
  }

  const castleDefense = 30;
  const dummyCastle = { stats: { defense: castleDefense }, job: "castle" };
  const damage = Math.max(1, computeDamage(unit, dummyCastle));
  castles[hpKey] = Math.max(0, (castles[hpKey] ?? 0) - damage);
  state.log.push({ turn: state.turn, message: `${unit.name} が敵城に ${damage} ダメージ` });
  queueEffect(state, {
    kind: "attack",
    position: castlePos,
    sound: "attack",
    source: unit.position,
    target: castlePos,
    variant: "siege"
  });

  if (castles[hpKey] <= 0) {
    state.log.push({ turn: state.turn, message: `${enemySide === "west" ? "西軍" : "東軍"}の城が陥落した` });
  }
}

function handleSkill(state, unit, command) {
  console.log(`handleSkill called for unit: ${unit.name} (job: ${unit.job})`);
  if (!unit.skill) {
    state.log.push({ turn: state.turn, message: `${unit.name} には使用可能なスキルがない` });
    return;
  }
  if (unit.skill.used) {
    state.log.push({ turn: state.turn, message: `${unit.name} のスキルは既に使用済み` });
    return;
  }

  // 対象ユニット取得
  const target =
    command?.targetId !== undefined
      ? state.units.find((u) => u.id === command.targetId)
      : null;

  // ジョブごとのdoSkill呼び出し
  const skillHandler = jobsMap[unit.job];
  console.log("Skill handler for job", unit.job, ":", skillHandler);
  if (skillHandler && typeof skillHandler.doSkill === 'function') {
    skillHandler.doSkill(state, unit, target);
    unit.skill.used = true;
  } else {
    state.log.push({ turn: state.turn, message: `${unit.name}のスキルは未実装です` });
  }
}

function checkEndCondition(state, config) {
  const westCastle = state.map.castles.westHp;
  const eastCastle = state.map.castles.eastHp;
  const turnLimit = config?.maxTurn ?? 20;

  //console.log("turnLimit:", turnLimit,"config:", config, "state:", state);
  // 通常の城陥落判定
  if (westCastle <= 0 || eastCastle <= 0) {
    state.status.finished = true;
    if (westCastle <= 0 && eastCastle <= 0) {
      state.status.winner = "引き分け";
    } else {
      state.status.winner = westCastle <= 0 ? "東軍" : "西軍";
    }
    return;
  }

  // ターン数制限による判定
  if (state.turn >= turnLimit) {
    state.status.finished = true;
    if (westCastle > eastCastle) {
      state.status.winner = "西軍";
    } else if (eastCastle > westCastle) {
      state.status.winner = "東軍";
    } else {
      // 城HP同じなら生存ユニット数で判定
      const westAlive = state.units.filter(u => u.side === "west" && u.hp > 0).length;
      const eastAlive = state.units.filter(u => u.side === "east" && u.hp > 0).length;
      if (westAlive > eastAlive) {
        state.status.winner = "西軍";
      } else if (eastAlive > westAlive) {
        state.status.winner = "東軍";
      } else {
        state.status.winner = "引き分け";
      }
    }
  }
}

function pruneExpiredEffects(state) {
  const now = Date.now();
  state.effects = (state.effects ?? []).filter((effect) => now - effect.createdAt < effect.durationMs);
}

export function queueEffect(
  state,
  {
    kind,
    position,
    durationMs = 600,
    sound = null,
    jobSounds = [],
    source = null,
    target = null,
    variant = null,
    label = null,
    traceLabel = null,
    impactLabel = null,
    job = null
  }
) {
  const now = Date.now();
  const id = (state.effectSeq = (state.effectSeq ?? 0) + 1);
  if (!state.effects) state.effects = [];
  const normalizedJobSounds = normalizeJobSounds(jobSounds);
  state.effects.push({
    id,
    kind,
    position: { x: position.x, y: position.y },
    createdAt: now,
    durationMs,
    sound,
    ...(normalizedJobSounds.length ? { jobSounds: normalizedJobSounds } : {}),
    ...(source ? { source: { x: source.x, y: source.y } } : {}),
    ...(target ? { target: { x: target.x, y: target.y } } : {}),
    ...(variant ? { variant } : {}),
    ...(label ? { label } : {}),
    ...(traceLabel ? { traceLabel } : {}),
    ...(impactLabel ? { impactLabel } : {}),
    ...(job ? { job } : {}),
    played: false
  });
}

function normalizeJobSounds(list) {
  if (!Array.isArray(list) || list.length === 0) return [];
  return list
    .map((entry) => {
      if (!entry || !entry.job || !entry.kind) return null;
      return { job: entry.job, kind: entry.kind };
    })
    .filter(Boolean);
}

function distanceBetween(a, b) {
  const dx = (a?.x ?? 0) - (b?.x ?? 0);
  const dy = (a?.y ?? 0) - (b?.y ?? 0);
  return Math.hypot(dx, dy);
}