export class Overlay {
  constructor(renderer) {
    this.renderer = renderer;
    this.logElem = document.getElementById("log-list");
    this.unitDetails = document.getElementById("unit-details");
    this.message = document.createElement("div");
    this.logElem.appendChild(this.message);
    this.selectHandler = null;

    this.bgmSelectEl = null;
    this.selectedBgmKey = "";
    this._pendingBgmOptions = null;
    this._pendingBgmDefault = "";

    this._initBgmSelector();
    if (!this.bgmSelectEl) {
      window.addEventListener(
        "DOMContentLoaded",
        () => this._initBgmSelector(),
        { once: true }
      );
    }
  }

  _initBgmSelector() {
    if (this.bgmSelectEl) return;

    const startButton = document.getElementById("btn-start");
    const parent = startButton?.parentElement;
    if (!startButton || !parent) return;

    const wrapper = document.createElement("label");
    wrapper.className = "bgm-select-wrapper";
    wrapper.textContent = "BGM: ";

    const select = document.createElement("select");
    select.className = "bgm-select";
    wrapper.appendChild(select);

    parent.insertBefore(wrapper, startButton.nextSibling);

    select.addEventListener("change", (event) => {
      this.selectedBgmKey = event.target.value;
    });

    this.bgmSelectEl = select;

    if (this._pendingBgmOptions) {
      const options = this._pendingBgmOptions;
      const defaultKey = this._pendingBgmDefault;
      this._pendingBgmOptions = null;
      this._pendingBgmDefault = "";
      this.setBgmOptions(options, defaultKey);
    } else {
      this.selectedBgmKey = select.value || "";
    }
  }

  setBgmOptions(options = [], defaultKey = "") {
    if (!this.bgmSelectEl) {
      this._pendingBgmOptions = options;
      this._pendingBgmDefault = defaultKey;
      this._initBgmSelector();
      return;
    }

    this.bgmSelectEl.innerHTML = "";

    const noneOption = document.createElement("option");
    noneOption.value = "";
    noneOption.textContent = "BGMなし";
    this.bgmSelectEl.appendChild(noneOption);

    options.forEach(({ key, title }) => {
      console.log("Adding BGM option:", key, title);
      if( key.startsWith("main")){
        const option = document.createElement("option");
        option.value = key;
        option.textContent = title || key;
        this.bgmSelectEl.appendChild(option);
      }
    });

    const initialValue = defaultKey || this.bgmSelectEl.options[1]?.value || "";
    this.bgmSelectEl.value = initialValue;
    this.selectedBgmKey = this.bgmSelectEl.value;
  }

  getSelectedBgmKey() {
    return this.selectedBgmKey;
  }

  update(state) {
    this.renderLog(state.log.slice(-20));
    this.renderUnits(state.units);
  }

  renderLog(entries) {
    this.logElem.innerHTML = entries
      .map((entry) => `<div>[${entry.turn}] ${entry.message}</div>`)
      .join("");
  }

  renderUnits(units) {
    const colorBySide = {
      east: "#4aa3ff",
      west: "#ff7b71"
    };

    this.unitDetails.innerHTML = units
      .map((u) => {
        const nameColor = colorBySide[u.side] || "#d9d9d9";
        const opacity = u.hp <= 0 ? 0.45 : 1;
        return `<div class="unit-row" data-id="${u.id}" style="opacity:${opacity};">
        <strong style="color:${nameColor};">${u.name}</strong> (${u.job}) HP: ${u.hp} pos: (${Math.floor(u.position.x)}, ${Math.floor(u.position.y)})
      </div>`;
      })
      .join("");
    this.unitDetails.querySelectorAll(".unit-row").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-id");
        this.selectHandler?.(id);
      });
    });
  }

  clearLog() {
    this.logElem.innerHTML = "";
  }

  showMessage(text) {
    this.logElem.innerHTML = `<div class="info">${text}</div>`;
  }

  showError(text) {
    this.logElem.innerHTML = `<div class="error">${text}</div>`;
  }

  bindSelection(handler) {
    this.selectHandler = handler;
  }

  updateSelection(id, state) {
    const unit = state.units.find((u) => u.id === id);
    if (!unit) return;
    this.unitDetails.innerHTML = `<h3>${unit.id}</h3>
      <p>JOB: ${unit.job}</p>
      <p>HP: ${unit.hp}</p>
      <p>位置: (${unit.position.x.toFixed(1)}, ${unit.position.y.toFixed(1)})</p>
      <p>速度: ${unit.stats.speed} (移動${unit.stats.speed / 10}マス/ターン)</p>
    <p>射程: ${(unit.stats.range / 10).toFixed(1)}マス</p>
      <p>スキル: ${unit.skill.used ? "使用済み" : "未使用"}</p>`;
  }

  highlightUnit(id) {
    // optional highlight
  }
}