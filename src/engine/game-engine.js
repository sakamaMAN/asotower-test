
import { createInitialState } from "./state.js";
import { createTurnProcessor } from "./actions.js?v=202510231431";
import { ReplayRecorder } from "../render/replay-recorder.js";
import { Sandbox } from "../sdk/sandbox.js";
import { loadConfig } from "../sdk/api.js";
import { audioManager } from "../render/audio-manager.js?v=202510231450";


export async function loadTeams() {
  const config = await loadConfig();
  const [west, east] = await Promise.all([
    loadSide("west", config),
    loadSide("east", config)
  ]);
  return { west, east, config };
}

async function loadSide(side, config) {
  const team = [];
  for (const slot of config[side]) {
    const moduleUrl = new URL(`../teams/${side}/${slot.file}`, import.meta.url);
    moduleUrl.searchParams.set("v", Date.now().toString());
    const mod = await Sandbox.importModule(moduleUrl.href);
    team.push({
      slot: slot.slot,
      file: slot.file,
      job: slot.job,
      initialPosition: slot.initialPosition,
      module: mod,
      side
    });
  }
  return team;
}

export function createBattle({ west, east, config, renderer, overlay }) {
  const sandbox = new Sandbox();
  const recorder = new ReplayRecorder();

  const state = createInitialState({ west, east, config, sandbox })
  window.__ASOTOWER_STATE__ = state;
  state.config = config;
  
  const turnIntervalMs = config.turnIntervalMs ?? 5000;
  let timerId = null;
  let effectFrame = null;
  let fanfarePlayed = false;

  const loop = {
    running: false,
    speed: 1,
    interval: turnIntervalMs,
    selectUnit(id) {
      renderer.focusUnit(id);
      overlay.updateSelection(id, state);
    },
    play() {
      if (this.running) return;
      this.running = true;
      scheduleNextTurn();
    },
    pause() {
      if (!this.running) return;
      this.running = false;
      clearTimer();
    },
    step() {
      this.pause();
      runTurn().catch((error) => console.error("runTurn error:", error));
    },
    setSpeed(speed) {
      this.speed = Math.max(0.1, speed);
      if (this.running) {
        scheduleNextTurn();
      }
    },
    start() {
      this.play();
    }
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const waitForNextFrame = () =>
    new Promise((resolve) => requestAnimationFrame(resolve));

  async function runTurn() {
    //console.log("runTurn state:", state);
    const processor = createTurnProcessor(state, config);
    const unitActionIntervalMs = Math.max(
      0,
      Number(
        config.unitActionIntervalMs ?? state.config?.unitActionIntervalMs ?? 0
      ) || 0
    );

    while (true) {
      const step = await processor.next();
      if (!step) break;

      renderer.render(state);
      overlay.update(state);
      playPendingEffectAudio();
      ensureEffectLoop();

      if (state.status.finished) break;

      await waitForNextFrame();
      if (unitActionIntervalMs > 0) {
        await sleep(unitActionIntervalMs);
      }
    }

    processor.finalize();

    playPendingEffectAudio();
    renderer.render(state);
    overlay.update(state);
    ensureEffectLoop();
    if (state.status.finished) {
      loop.running = false;
      clearTimer();
      if (!fanfarePlayed) {
        audioManager.playBgmKey("fanfare");
        fanfarePlayed = true;
      }
      overlay.showMessage(`試合終了: ${state.status.winner} 勝利`);
    }
  }

  function clearTimer() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function scheduleNextTurn() {
    clearTimer();
    if (!loop.running || state.status.finished) return;
    const baseDelay = Math.max(16, loop.interval / loop.speed);
    timerId = setTimeout(async () => {
      timerId = null;
      if (!loop.running) return;
      try {
        await runTurn();
      } catch (error) {
        console.error("runTurn error:", error);
      }
      if (loop.running && !state.status.finished) {
        scheduleNextTurn();
      }
    }, baseDelay);
  }

  function playPendingEffectAudio() {
    const effects = state.effects ?? [];
    effects.forEach((effect) => {
      if (effect.played) return;
      if (effect.sound) {
        audioManager.playSfxKey(effect.sound);
      }
      if (Array.isArray(effect.jobSounds)) {
        effect.jobSounds.forEach(({ job, kind }) => {
          audioManager.playJobSfx(job, kind);
        });
      }
      effect.played = true;
    });
  }

  function ensureEffectLoop() {
    if (!state.effects?.length) {
      if (effectFrame !== null) {
        cancelAnimationFrame(effectFrame);
        effectFrame = null;
        renderer.render(state);
      }
      return;
    }

    if (effectFrame !== null) return;

    const step = () => {
      const now = Date.now();
      const active = (state.effects ?? []).filter((effect) => {
        const life = effect.durationMs ?? 600;
        return now - effect.createdAt < life;
      });

      if (active.length !== (state.effects?.length ?? 0)) {
        state.effects = active;
      }

      renderer.render(state);

      if (active.length > 0) {
        effectFrame = requestAnimationFrame(step);
      } else {
        effectFrame = null;
      }
    };

    effectFrame = requestAnimationFrame(step);
  }

  renderer.render(state);
  overlay.update(state);

  return loop;
}