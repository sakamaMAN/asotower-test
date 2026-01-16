import { loadTeams, createBattle } from "./engine/game-engine.js?v=202510261659";
import { Renderer } from "./render/renderer.js?v=202510261659";
import { Overlay } from "./render/ui-overlay.js?v=202510261659";
import { Controls } from "./render/controls.js?v=202510261659";
import { validateTeams } from "./sdk/validator.js?v=202510261721";
import { createInitialState } from "./engine/state.js?v=202510261718";
import { Sandbox } from "./sdk/sandbox.js?v=202510230936";
import { AudioManager } from "./render/audio-manager.js?v=202510261659";

const canvas = document.getElementById("battle-canvas");
const renderer = new Renderer(canvas);
const audioManager = new AudioManager();
const overlay = new Overlay(renderer);
const controls = new Controls();

let battle = null;
let loadedTeams = null;
let previewState = null;

async function preparePreview() {
  battle = null;
  overlay.clearLog();
  overlay.showMessage("チーム読込中…");

  loadedTeams = await loadTeams();

  previewState = createInitialState({
    west: loadedTeams.west,
    east: loadedTeams.east,
    config: loadedTeams.config,
    sandbox: new Sandbox()
  });

  renderer.render(previewState);
  overlay.update(previewState);

  let vresult = validateTeams(loadedTeams.west, loadedTeams.east, loadedTeams.config);
  if (!vresult.ok) {
    overlay.showError(`チームの検証に失敗しました:`);
    for (const line of vresult.message.split("\n")) {
      overlay.showError(line);
    }
    document.getElementById("controls").style.display = "none";
    return;
  }
  document.getElementById("btn-start").disabled = false;
  overlay.showMessage("準備完了。戦闘開始を押してください。");
}

async function startBattle() {
  if (!loadedTeams) {
    await preparePreview();
  }

  const { west, east, config } = loadedTeams;

  overlay.clearLog();
  overlay.showMessage("戦闘開始！");

  await audioManager.playBgmKey(overlay.getSelectedBgmKey());
  battle = createBattle({ west, east, config, renderer, overlay });
  battle.play();
}

//controls.on("play", () => battle?.play());
//controls.on("pause", () => battle?.pause());
//controls.on("step", () => battle?.step());
//controls.on("speed", (speed) => battle?.setSpeed(speed));
controls.on("start", startBattle);
//controls.on("download-replay", () => battle?.exportReplay());
//controls.on("load-replay", (file) => battle?.loadReplay(file));

overlay.bindSelection((unitId) => battle?.selectUnit(unitId));
//renderer.onHover((unitId) => overlay.highlightUnit(unitId));

window.addEventListener("DOMContentLoaded", () => {
  preparePreview().catch((error) => console.error("初期配置の描画に失敗しました:", error));
  //overlay.showMessage("準備完了。戦闘開始を押してください。");
});

audioManager.getBgmOptions().then((options) => {
  overlay.setBgmOptions(options, audioManager.getCurrentBgmKey());
});

