import { MAP_DATA } from "../data/map.js?v=202510261134";

function clonePoint(point = { x: 0, y: 0 }) {
  return {
    x: typeof point.x === "number" ? point.x : 0,
    y: typeof point.y === "number" ? point.y : 0
  };
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function castleInfo(side) {
  const castles = MAP_DATA.castles ?? {};
  const position = castles?.[side];
  if (!position) return null;
  const hpKey = `${side}Hp`;
  const hp = Number.isFinite(Number(castles?.[hpKey])) ? Number(castles[hpKey]) : null;
  return {
    position: clonePoint(position),
    hp
  };
}

function usesCastleOrigin(raw) {
  if (!raw || typeof raw !== "object") return false;
  const reference = raw.relativeTo ?? raw.relative ?? raw.origin ?? raw.reference ?? raw.from;
  if (typeof reference === "string") {
    const key = reference.toLowerCase();
    if (key === "castle" || key === "allycastle" || key === "selfcastle") return true;
  }
  if (raw.useCastleOffset === true) return true;
  if (raw.mode === "castleOffset") return true;
  return false;
}

export function buildInitContext(side) {
  const ally = castleInfo(side);
  const enemy = castleInfo(side === "west" ? "east" : "west");
  return {
    side,
    mapSize: { width: MAP_DATA.width, height: MAP_DATA.height },
    allyCastle: ally,
    enemyCastle: enemy
  };
}

export function resolveUnitPosition(rawPosition, fallbackPosition, side) {
  const castles = MAP_DATA.castles ?? {};
  const castle = castles?.[side];
  const fallback = clonePoint(fallbackPosition ?? castle ?? { x: 0, y: 0 });

  //console.log("resolveUnitPosition:", { rawPosition, fallbackPosition, side, castle, fallback });
  if (!rawPosition || typeof rawPosition !== "object") {
    if (
      rawPosition &&
      typeof rawPosition.x === "number" &&
      typeof rawPosition.y === "number"
    ) {
      return { x: rawPosition.x, y: rawPosition.y };
    }
    return fallback;
  }

  if (
    usesCastleOrigin(rawPosition) ||
    (rawPosition.offset && usesCastleOrigin(rawPosition.offset))
  ) {
    if (!castle) return fallback;
    const base = rawPosition.offset && typeof rawPosition.offset === "object" ? rawPosition.offset : rawPosition;
    const forward = toNumber(base.forward, 0);
    const lateral = toNumber(base.lateral, 0);
    let dx = toNumber(base.x, 0);
    let dy = toNumber(base.y, 0);
    const direction = side === "west" ? 1 : -1;
    dx *= direction;
    if (lateral !== 0) {
      dy += lateral;
    }
    return {
      x: castle.x + dx,
      y: castle.y + dy
    };
  }

  if (rawPosition.forward !== undefined || rawPosition.lateral !== undefined) {
    if (!castle) return fallback;
    const direction = side === "west" ? 1 : -1;
    const dx = toNumber(rawPosition.forward, 0) * direction;
    const dy = toNumber(rawPosition.lateral, 0);
    return {
      x: castle.x + dx,
      y: castle.y + dy
    };
  }

  if (
    typeof rawPosition.x === "number" &&
    typeof rawPosition.y === "number"
  ) {
    return { x: rawPosition.x, y: rawPosition.y };
  }

  return fallback;
}
