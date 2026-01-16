export class ReplayRecorder {
  constructor() {
    this.frames = [];
  }

  record(state) {
    this.frames.push(structuredClone(state));
  }

  download() {
    const blob = new Blob([JSON.stringify(this.frames)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `replay-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  load(file, callback) {
    const reader = new FileReader();
    reader.onload = () => {
      const frames = JSON.parse(reader.result);
      callback(frames);
    };
    reader.readAsText(file);
  }
}