export class Controls {
  constructor() {
    this.handlers = {};
    this.bind();
  }

  bind() {
    //this.btnPlay = document.getElementById("btn-play");
    //this.btnPause = document.getElementById("btn-pause");
    //this.btnStep = document.getElementById("btn-step");
    //this.speedSelect = document.getElementById("speed-select");
    this.btnStart = document.getElementById("btn-start");

    //this.btnPlay?.addEventListener("click", () => this.emit("play"));
    //this.btnPause?.addEventListener("click", () => this.emit("pause"));
    //this.btnStep?.addEventListener("click", () => this.emit("step"));
    //this.speedSelect?.addEventListener("change", (e) => this.emit("speed", Number(e.target.value)));
    this.btnStart?.addEventListener("click", () => this.emit("start"));
  }

  on(event, handler) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
  }

  emit(event, payload) {
    (this.handlers[event] || []).forEach((handler) => handler(payload));
  }
}