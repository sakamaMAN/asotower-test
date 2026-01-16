import { JOB_DATA } from "../data/jobs.js?v=202510252230";
import { MAP_DATA } from "../data/map.js?v=202510252230";

export async function loadConfig() {
  const response = await fetch("./config/team-map.json?v=202510252230");
  const baseConfig = await response.json();

  return structuredClone({
    west: baseConfig.west,
    east: baseConfig.east,
    maxUnits: baseConfig.maxUnits,
    maxTurn: baseConfig.maxTurn ?? 20,
    turnIntervalMs: baseConfig.turnIntervalMs ?? 5000,
    unitActionIntervalMs: baseConfig.unitActionIntervalMs ?? 500,
    jobs: JOB_DATA,
    map: MAP_DATA
  });
}