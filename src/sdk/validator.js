import { JOB_DATA } from "../data/jobs.js?v=202510261718";
import {
  buildInitContext,
  resolveUnitPosition
} from "../shared/unit-position.js?v=202510261137";
import { MAP_DATA } from "../data/map.js?v=202510261144";

const HALF_MAP_WIDTH = Math.floor((MAP_DATA?.width ?? MAP_DATA?.size?.x ?? 0) / 2);

export function validateTeams(west, east, config) {
  const errors = [];
  const allUnits = [...west, ...east];

  if (west.length !== config.maxUnits || east.length !== config.maxUnits) {
    errors.push(`各軍は ${config.maxUnits} 人である必要があります。`);
  }

  for (const unit of allUnits) {
    if (!JOB_DATA[unit.job]) {
      errors.push(`${unit.side}の${unit.name ?? unit.file} のJOB ${unit.job} は未定義です。`);
    }
    const initContext = buildInitContext(unit.side);
    const initResult = unit.module.init?.(initContext) ?? {};
    const job = initResult.job ?? unit.job;
    // ボーナス合計値チェック
    const bonus = initResult.bonus ?? {};
    const bonusSum = Object.values(bonus).reduce((a, b) => a + (b ?? 0), 0);
    if (bonusSum > 10) {
      errors.push(`${unit.side}の${unit.name ?? unit.file} のボーナス合計が10を超えています（${bonusSum}）。失格扱いとなります。`);
      unit.hp = 0;
    }
    if (!JOB_DATA[job]) {
      console.log(`${unit.side}の${unit.name ?? unit.id ?? unit.file} のinitが不正なJOBを返しました。${job} は未定義です。`);
      errors.push(`${unit.side}の${unit.name ?? unit.id ?? unit.file} のinitが不正なJOBを返しました。${job} は未定義です。`);
    }
    const resolvedPosition = resolveUnitPosition(initResult.initialPosition, unit.initialPosition, unit.side);
    
    //console.log("unit.name:",unit," resolvedPosition:", resolvedPosition);
    const validX =
      unit.side === "west"
        ? resolvedPosition.x < HALF_MAP_WIDTH
        : resolvedPosition.x >= HALF_MAP_WIDTH;
    if (!validX) {
      console.log("invalid position for unit:", unit, resolvedPosition);
      unit.side === "west"
        ? errors.push(`${unit.side} の${unit.name ?? unit.file} の初期位置が陣地範囲外(x=${resolvedPosition.x-MAP_DATA.castles.west.x})です。${HALF_MAP_WIDTH-MAP_DATA.castles.west.x}より小さい値である必要があります。`)
        : errors.push(`${unit.side} の${unit.name ?? unit.file} の初期位置が陣地範囲外(x=${MAP_DATA.castles.east.x-resolvedPosition.x})です。${MAP_DATA.castles.east.x-HALF_MAP_WIDTH}より小さい値である必要があります。`)
    }
  }
  
  if (errors.length) {
    return { ok: false, message: errors.join("\n") };
  }
  return { ok: true };
}