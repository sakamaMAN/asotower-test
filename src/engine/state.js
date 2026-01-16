import { JOB_DATA } from "../data/jobs.js?v=202510261709";
import { MAP_DATA } from "../data/map.js?v=202510261144";
import {
  buildInitContext,
  resolveUnitPosition
} from "../shared/unit-position.js?v=202510252114";

export function createInitialState({ west, east, config, sandbox }) {
  const units = [];
  const allTeams = [
    { side: "west", team: west },
    { side: "east", team: east }
  ];

  for (const { side, team } of allTeams) {
    for (const info of team) {
      const module = info.module;
      const initContext = buildInitContext(side);
      const initResult = module.init?.(initContext) || {};
      const jobKey = initResult.job ?? info.job;
      const job = JOB_DATA[jobKey];
      const pos = resolveUnitPosition(initResult.initialPosition, info.initialPosition, side);
      const rawName = typeof initResult.name === "string" ? initResult.name.trim() : "";
      const fallbackName = typeof jobKey === "string" && jobKey.length ? jobKey : `${side}-${info.slot}`;
      const unitName = rawName || fallbackName;
      // ボーナス加算
      const bonus = initResult.bonus ?? {};
      const stats = { ...job.stats };
      for (const key of ["hp", "attack", "defense", "speed", "range"]) {
        stats[key] = (stats[key] ?? 0) + (bonus[key] ?? 0);
      }
      units.push({
        id: `${side}-${info.slot}`,
        side,
        slot: info.slot,
        job: jobKey,
        name: unitName,
        stats,
        skill: { ...job.skill, used: false },
        position: { ...pos },
        hp: stats.hp,
        memory: initResult.memory ?? {},
        module,
        sandbox
      });
    }
  }

  // MAP_DATAを複製し、tileSizeを追加
  const map = JSON.parse(JSON.stringify(MAP_DATA));

  return {
    turn: 1,
    map,
    units,
    log: [],
    effects: [],
    effectSeq: 0,
    // 各ターンの移動予約（キー: "x,y" -> unitId）。
    // scout のスキル中は通過を許すが、通過後は予約を作るため同ターン中の他移動を防げる。
    reservedCells: {},
    status: { finished: false, winner: null }
  };
}

export function cloneState(state) {
  return structuredClone(state);
}