import { AssetLoader } from "./asset-loader.js?v=202510231119";
import { getSprite as getJobSprite } from "../engine/jobs/index.js";

const TILE = 32;
const OVERLAY_HEIGHT = 32;

const COLORS = {
  fallbackGround: "#0f1624",
  laneOverlay: "rgba(60, 86, 130, 0.35)",
  westZone: "rgba(54, 123, 251, 0.12)",
  eastZone: "rgba(251, 92, 92, 0.12)",
  grid: "rgba(37, 50, 74, 0.6)",
  wallFallback: "#8892a6",
  wallText: "#111827",
  unitWest: "#ffceceff",
  unitEast: "#d2e4fbff",
  hpBg: "#111827",
  hpFillWest: "#f87171",
  hpFillEast: "#60a5fa",
  overlayBg: "rgba(15, 22, 36, 0.88)",
  overlayText: "#f8fafc",
  victoryFill: "#fcd34d",
  victoryStroke: "rgba(10, 15, 25, 0.8)",
  attackTraceMelee: "rgba(252, 211, 77, 0.9)",
  attackTraceRanged: "rgba(147, 197, 253, 0.9)",
  attackTraceSiege: "rgba(248, 113, 113, 0.9)",
  attackTraceOutline: "rgba(15, 23, 42, 0.9)",
  impactRing: "rgba(239, 68, 68, 0.8)"
};

export class Renderer {
  constructor(canvas, assetLoader = null) {
    console.log("Renderer constructor called params:", canvas, assetLoader);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.assetLoader = assetLoader ?? new AssetLoader();
    this.hoverHandler = null;
    canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
  }

  setAssetLoader(loader) {
    this.assetLoader = loader;
  }

  resizeToMap(map) {
    if (!map) return;
    this.canvas.width = map.width * TILE;
    this.canvas.height = map.height * TILE + OVERLAY_HEIGHT;
  }

  render(state) {
    const { ctx } = this;
    const map = state?.map;
    if (!map) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    if (this.canvas.width !== map.width * TILE || this.canvas.height !== map.height * TILE + OVERLAY_HEIGHT) {
      this.resizeToMap(map);
    }

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(0, OVERLAY_HEIGHT);
    this.drawBackground(ctx, map);
    this.drawZones(ctx, map);
    this.drawWalls(ctx, map.walls);
    this.drawCastles(ctx, map.castles);
    this.drawUnits(ctx, state?.units ?? []);
    this.drawMageFire(ctx, state); // magefire描画
    this.drawEffects(ctx, state?.effects ?? []);
    if (state?.status?.finished) {
      this.drawVictory(ctx, state.status.winner);
    }
    ctx.restore();

    this.drawOverlay(ctx, state);
  }

  drawMageFire(ctx, state) {
    // magefire画像を描画
    const magefireImg = this.getImage("map_magefire");
    if (!magefireImg) return;
    const tileSize = state.map.tileSize || TILE;
    state.units.forEach(unit => {
      if (unit.job !== "mage" || !unit.memory?.mageDot || unit.hp <= 0) return;
      // mage.positionを中心に2マス範囲
      const center = unit.position;
      const range = 2;
      for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
          // 円形範囲のみ
          if (Math.sqrt(dx * dx + dy * dy) > range) continue;
          const tx = center.x + dx;
          const ty = center.y + dy;
          // マップ外は描画しない
          if (tx < 0 || ty < 0 || tx >= state.map.width || ty >= state.map.height) continue;
          const px = tx * tileSize;
          const py = ty * tileSize;
          ctx.drawImage(magefireImg, px, py, tileSize, tileSize);
        }
      }
    });
  }

  drawBackground(ctx, map) {
    const ground = this.getImage("map_ground");
    for (let gx = 0; gx < map.width; gx++) {
      for (let gy = 0; gy < map.height; gy++) {
        const px = gx * TILE;
        const py = gy * TILE;
        if (ground) ctx.drawImage(ground, px, py, TILE, TILE);
        else {
          ctx.fillStyle = COLORS.fallbackGround;
          ctx.fillRect(px, py, TILE, TILE);
        }
      }
    }

    const laneRows = 8;
    const laneTop = Math.floor((map.height - laneRows) / 2);
    const path = this.getImage("map_path");
    for (let gx = 0; gx < map.width; gx++) {
      for (let gy = laneTop; gy < laneTop + laneRows; gy++) {
        const px = gx * TILE;
        const py = gy * TILE;
        if (path) ctx.drawImage(path, px, py, TILE, TILE);
        else {
          ctx.fillStyle = COLORS.laneOverlay;
          ctx.fillRect(px, py, TILE, TILE);
        }
      }
    }

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= map.width; x++) {
      const px = Math.floor(x * TILE) + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, map.height * TILE);
      ctx.stroke();
    }
    for (let y = 0; y <= map.height; y++) {
      const py = Math.floor(y * TILE) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(map.width * TILE, py);
      ctx.stroke();
    }
  }

  drawZones(ctx, map) {
    const zoneTiles = Math.floor(map.width / 2);
    const zoneWidth = zoneTiles * TILE;
    ctx.fillStyle = COLORS.westZone;
    ctx.fillRect(0, 0, zoneWidth, map.height * TILE);
    ctx.fillStyle = COLORS.eastZone;
    ctx.fillRect(map.width * TILE - zoneWidth, 0, zoneWidth, map.height * TILE);
  }

  drawWalls(ctx, walls = []) {
    const wall = this.getImage("map_wall_intact");
    walls.forEach((cell) => {
      const { x, y } = toTopLeftPixels(cell);
      if (wall) ctx.drawImage(wall, x, y, TILE, TILE);
      else {
        ctx.fillStyle = COLORS.wallFallback;
        ctx.fillRect(x, y, TILE, TILE);
      }
      ctx.fillStyle = COLORS.wallText;
      ctx.font = "10px sans-serif";
      ctx.fillText(`${cell.hp}`, x + 6, y + 16);
    });
  }

  drawCastles(ctx, castles) {
    if (!castles) return;
    const draw = (key, hp, label) => {
      const img = this.getImage(key.image);
      const pos = castles[key.info];
      if (!pos) return;
      const center = toCenterPixels(pos);
      const width = TILE * 2;
      const height = TILE * 3;
      if (img) ctx.drawImage(img, center.x - width / 2, center.y - height / 2, width, height);
      else {
        ctx.fillStyle = key.fallback;
        ctx.fillRect(center.x - width / 2, center.y - height / 2, width, height);
      }
      ctx.fillStyle = COLORS.overlayText;
      ctx.font = "12px sans-serif";
      ctx.fillText(label, center.x - width / 2, center.y - height / 2 - 6);
      ctx.fillText(`HP:${hp}`, center.x - width / 2, center.y + height / 2 + 14);
    };

    draw(
      { image: "castle_west", info: "west", fallback: "#3a78ff" },
      castles.westHp,
      "西軍の城"
    );
    draw(
      { image: "castle_east", info: "east", fallback: "#ff6363" },
      castles.eastHp,
      "東軍の城"
    );
  }

  drawUnits(ctx, units) {
    units.forEach((unit) => {
      if (unit.hp <= 0) return;
      ctx.save();
      // ステルス状態なら半透明
      if (unit.memory?.stealth?.turns > 0) {
        ctx.globalAlpha = 0.5;
      }
      const center = toCenterPixels(unit.position);
      let jobSprite;
      if (unit.job === 'monster') {
        // 攻撃中フラグ（isAttacking or isAttackingUntil）で画像切り替え
        const now = Date.now();
        const isAttacking = !!(unit.memory?.isAttacking || (unit.memory?.isAttackingUntil && unit.memory.isAttackingUntil > now));
        if (isAttacking) {
          jobSprite = this.getImage('job_monster_attack');
        } else {
          jobSprite = this.getImage('job_monster');
        }
      } else {
        // ジョブ側にスプライト決定ロジックを委譲（存在しない場合は job_{job} を返す）
        const key = getJobSprite(unit) || `job_${unit.job}`;
        jobSprite = this.getImage(key);
      }
      const unitColor = unit.side === "west" ? COLORS.unitWest : COLORS.unitEast;
      ctx.fillStyle = unitColor;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 16, 0, Math.PI * 2);
      ctx.fill();

      if (jobSprite) {
        ctx.drawImage(jobSprite, center.x - TILE * 0.75, center.y - TILE * 0.75, TILE * 1.5, TILE * 1.5);
      } else {
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(center.x, center.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(unit.job.slice(0, 2).toUpperCase(), center.x, center.y);
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
      }

      ctx.fillStyle = COLORS.hpBg;
      ctx.fillRect(center.x - 18, center.y + 18, 36, 5);
      const hpColor = unit.side === "west" ? COLORS.hpFillWest : COLORS.hpFillEast;
      ctx.fillStyle = hpColor;
      ctx.fillRect(center.x - 18, center.y + 18, 36 * Math.max(0, unit.hp / unit.stats.hp), 5);

      const label = unit.name ?? unit.job;
      ctx.fillStyle = unit.side === "west" ? COLORS.unitWest : COLORS.unitEast;
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(label, center.x, center.y - 22);
      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";
      ctx.restore();
    });
  }

  drawEffects(ctx, effects = []) {
    if (!effects.length) return;
    const now = Date.now();

    effects.forEach((effect) => {
      const lifespan = effect.durationMs ?? 600;
      const elapsed = now - effect.createdAt;
      if (elapsed < 0 || elapsed >= lifespan) return;

      const progress = Math.min(1, Math.max(0, elapsed / lifespan));
      const alpha = 1 - progress;
      if (alpha <= 0) return;

      ctx.save();
      ctx.globalAlpha = alpha;

      switch (effect.kind) {
        case "attack":
          this.drawAttackTrace(ctx, effect, progress);
          this.drawAttackImpact(ctx, effect, progress);
          break;
        case "impactRing":
          this.drawImpactRing(ctx, effect, progress);
          break;
        case "smoke":
          this.drawSmokeEffect(ctx, effect, progress);
          break;
        case "heal_special":
          this.drawHealSpecialEffect(ctx, effect, progress);
          break;
        case "magefire":
          this.drawMageFireEffect(ctx, effect, progress);
          break;
        case "move":
          // 移動は画像エフェクトなし
          break;
        case "skill":
        case "effect":
        default:
          this.drawStockEffect(ctx, effect, progress);
          break;
      }
      ctx.restore();
    });
  }

  drawSmokeEffect(ctx, effect, progress) {
    // サモナーが召喚したモンスターの消滅エフェクト用
    const center = toCenterPixels(effect.position);
    // 優先：job_{job}_smoke を使う（asset-manifest.json の jobs に smoke を置いた場合）
    if (effect.job) {
      const imgKey = `job_${effect.job}_smoke`;
      const sprite = this.getImage(imgKey);
      if (sprite) {
        const baseSize = TILE * 2.4;
        const scale = 1 + 0.25 * Math.sin(progress * Math.PI);
        const size = baseSize * scale;
        ctx.drawImage(sprite, center.x - size / 2, center.y - size / 2, size, size);
        return;
      }
    }
    // フォールバック：汎用エフェクト描画
    this.drawStockEffect(ctx, effect, progress);
  }
  
  drawMageFireEffect(ctx, effect, progress) {
    const magefireImg = this.getImage("map_magefire");
    if (!magefireImg) return;
    const tileSize = effect.tileSize || TILE;
    const center = toTopLeftPixels(effect.position);
    ctx.drawImage(magefireImg, center.x, center.y, tileSize, tileSize);
  }

  drawHealSpecialEffect(ctx, effect, progress) {
    // 白い光で包むエフェクト（淡い白円オーバーレイ、フェードイン→アウト）
    const center = toCenterPixels(effect.position);
    const maxRadius = TILE * 1.2;
    const radius = maxRadius * (0.7 + 0.3 * Math.sin(progress * Math.PI));
    ctx.save();
    ctx.globalAlpha *= 0.45 * (1 - Math.abs(progress - 0.5) * 2); // 中央で最大、両端で0
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.shadowColor = "#f8fafc";
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.restore();
  }

  drawStockEffect(ctx, effect, progress) {
    //console.log("drawStockEffect called with params:", ctx, effect, progress);
    const center = toCenterPixels(effect.position);
    let imageKey = "effect_skill_flash";
    // ジョブごとのスキル画像
    // effect.skill === 'self' の場合は自ユニット用の job_{job}_skill を優先して表示する
    if ((effect.kind === "skill" && effect.job) || effect.skill === 'self') {
      const imageJobKey = `job_${effect.job}_skill`;
      const jobSprite = this.getImage(imageJobKey);
      if (jobSprite) {
        const baseSize = TILE * 3;
        const scale = 1 + 0.25 * Math.sin(progress * Math.PI);
        const size = baseSize * scale;
        ctx.drawImage(jobSprite, center.x - size / 2, center.y - size / 2, size, size);
        return;
      }
    }
    // 通常スキル画像
    const sprite = this.getImage(imageKey);
    const baseSize = effect.kind === "skill" ? TILE * 3 : TILE * 2;
    const scale = effect.kind === "skill" ? 1 + 0.25 * Math.sin(progress * Math.PI) : 1 + 0.2 * progress;
    const size = baseSize * scale;
    if (sprite) {
      ctx.drawImage(sprite, center.x - size / 2, center.y - size / 2, size, size);
    } else {
      const radius = (baseSize / 2) * scale;
      ctx.fillStyle = effect.kind === "skill" ? "rgba(212, 233, 255, 0.9)" : "rgba(255, 199, 141, 0.9)";
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawAttackTrace(ctx, effect, progress) {
    const start = effect.source ? toCenterPixels(effect.source) : toCenterPixels(effect.position);
    const end = effect.target ? toCenterPixels(effect.target) : toCenterPixels(effect.position);
    const variant = effect.variant ?? "ranged";
    const colors = {
      melee: COLORS.attackTraceMelee,
      ranged: COLORS.attackTraceRanged,
      siege: COLORS.attackTraceSiege
    };
    const color = colors[variant] ?? COLORS.attackTraceRanged;
    const width = variant === "melee" ? 12 : variant === "siege" ? 10 : 6;
    const wobble = variant === "ranged" ? Math.sin(progress * Math.PI * 2) * 6 : 0;

    ctx.strokeStyle = COLORS.attackTraceOutline;
    ctx.lineWidth = width + 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y + wobble);
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y + wobble);
    ctx.stroke();

    const headSize = width * 1.6;
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headSize * Math.cos(angle - Math.PI / 6), end.y - headSize * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(end.x - headSize * Math.cos(angle + Math.PI / 6), end.y - headSize * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  drawImpactRing(ctx, effect, progress) {
    const center = toCenterPixels(effect.position);
    const maxRadius = TILE * 1.2;
    const radius = maxRadius * (0.4 + 0.6 * progress);
    const lineWidth = Math.max(3, 10 * (1 - progress));

    ctx.strokeStyle = COLORS.impactRing;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawAttackImpact(ctx, effect, progress) {
    const target = effect.target ? toCenterPixels(effect.target) : toCenterPixels(effect.position);
    const source = effect.source ? toCenterPixels(effect.source) : toCenterPixels(effect.position);
    let imageKey = "effect_impact";
    // スキル由来の攻撃エフェクトなら対象側には汎用の skill_flash を表示する
    if (effect.skill === 'target') {
      const sprite = this.getImage('effect_skill_flash');
      const baseSize = TILE * 2.2;
      const scale = 1 + 0.4 * (1 - Math.abs(Math.cos(progress * Math.PI)));
      const size = baseSize * scale;
      const alpha = 1 - progress;
      ctx.save();
      ctx.globalAlpha *= alpha;
      if (sprite) {
        ctx.drawImage(sprite, target.x - size / 2, target.y - size / 2, size, size);
      } else {
        const radius = size / 2;
        const gradient = ctx.createRadialGradient(target.x, target.y, radius * 0.2, target.x, target.y, radius);
        gradient.addColorStop(0, "rgba(212, 233, 255, 0.95)");
        gradient.addColorStop(0.65, "rgba(212, 233, 255, 0.6)");
        gradient.addColorStop(1, "rgba(15, 23, 42, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(target.x, target.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    // ジョブごとの攻撃画像
    //console.log("drawAttackImpact effect.job:", effect.job);
    if (effect.job) {
      imageKey = `job_${effect.job}_attack`;
      const jobSprite = this.getImage(imageKey);
      // 表示時間を長く・はっきりさせるためalphaとscaleを調整
      if (jobSprite) {
        const baseSize = TILE * 2.2;
        // scale変化を緩やかに
        const scale = 1 + 0.25 * (1 - Math.abs(Math.cos(progress * Math.PI)));
        const size = baseSize * scale;
        // alpha減衰を遅く
        const alpha = 1 - progress * 0.5;
        ctx.save();
        ctx.globalAlpha *= Math.max(0.4, alpha); // 最低0.4は残す
        ctx.drawImage(jobSprite, source.x - size / 2, source.y - size / 2, size, size);
        ctx.restore();
        return;
      }
    }
    imageKey = "effect_impact";
    // 通常攻撃画像
    const sprite = this.getImage(imageKey);
    const baseSize = TILE * 2.2;
    const scale = 1 + 0.4 * (1 - Math.abs(Math.cos(progress * Math.PI)));
    const size = baseSize * scale;
    const alpha = 1 - progress;
    ctx.save();
    ctx.globalAlpha *= alpha;
    if (sprite) {
      ctx.drawImage(sprite, target.x - size / 2, target.y - size / 2, size, size);
    } else {
      const radius = size / 2;
      const gradient = ctx.createRadialGradient(target.x, target.y, radius * 0.2, target.x, target.y, radius);
      gradient.addColorStop(0, "rgba(252, 211, 77, 0.95)");
      gradient.addColorStop(0.65, "rgba(248, 113, 113, 0.6)");
      gradient.addColorStop(1, "rgba(15, 23, 42, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(target.x, target.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawVictory(ctx, winner) {
    if (!winner) return;
    const message = winner === "引き分け" ? "引き分け!!" : `${winner}勝利!!`;
    const mapWidth = this.canvas.width;
    const mapHeight = this.canvas.height - OVERLAY_HEIGHT;
    const centerX = mapWidth / 2;
    const centerY = mapHeight / 2;
    const fontSize = Math.floor(Math.min(mapWidth, mapHeight) / 5.5);
    const fontFamily = '"Yuji Syuku", "Yuji Mai", "Hiragino Mincho ProN", serif';

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(15, 22, 36, 0.4)";
    const bannerWidth = mapWidth * 0.72;
    const bannerHeight = fontSize * 1.4;
    ctx.fillRect(centerX - bannerWidth / 2, centerY - bannerHeight / 2, bannerWidth, bannerHeight);

    // 勝利側ユニット画像（job名_win）をバナーの後ろに横並びで表示
    if (winner === "東軍" || winner === "西軍") {
      const winSide = winner === "東軍" ? "east" : "west";
      const winUnits = this.lastUnits?.filter(u => u.side === winSide && u.hp > 0) ?? [];
      const imgSize = Math.floor(fontSize * 1.2);
      const totalWidth = winUnits.length * imgSize + Math.max(0, winUnits.length - 1) * 12;
      let startX = centerX - totalWidth / 2;
      winUnits.forEach((unit, i) => {
        const imgKey = `job_${unit.job}_win`;
        const sprite = this.getImage(imgKey);
        if (sprite) {
          ctx.globalAlpha = 0.7;
          ctx.drawImage(sprite, startX + i * (imgSize + 12), centerY - imgSize / 2 - fontSize, imgSize, imgSize);
          ctx.globalAlpha = 0.9;
        }
      });
    }

    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = COLORS.victoryStroke;
    ctx.lineWidth = Math.max(6, fontSize / 8);
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.strokeText(message, centerX, centerY);
    ctx.fillStyle = COLORS.victoryFill;
    ctx.fillText(message, centerX, centerY);
    ctx.restore();
  }

  drawOverlay(ctx, state) {
    ctx.fillStyle = COLORS.overlayBg;
    ctx.fillRect(0, 0, this.canvas.width, OVERLAY_HEIGHT);
    ctx.fillStyle = COLORS.overlayText;
    ctx.font = "12px sans-serif";
    ctx.fillText(`ターン: ${state?.turn ?? 0}`, 12, 20);
    const westAlive = state?.units?.filter((u) => u.side === "west" && u.hp > 0).length ?? 0;
    const eastAlive = state?.units?.filter((u) => u.side === "east" && u.hp > 0).length ?? 0;
    ctx.fillText(`西軍: ${westAlive}`, 120, 20);
    ctx.fillText(`東軍: ${eastAlive}`, 200, 20);
  }

  playReplay(frames) {
    console.info("Replay frames:", frames?.length ?? 0);
  }

  focusUnit(_id) {}

  onHover(handler) {
    this.hoverHandler = handler;
  }

  handleMouseMove(evt) {
    if (!this.hoverHandler) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top - OVERLAY_HEIGHT;
    if (y < 0) return this.hoverHandler(null);
    this.hoverHandler({
      x: Math.floor(x / TILE),
      y: Math.floor(y / TILE)
    });
  }

  getImage(key) {
    return this.assetLoader?.get(key) ?? null;
  }
}

function toCenterPixels(position) {
  return {
    x: position.x * TILE + TILE / 2,
    y: position.y * TILE + TILE / 2
  };
}

function toTopLeftPixels(position) {
  return {
    x: position.x * TILE,
    y: position.y * TILE
  };
}