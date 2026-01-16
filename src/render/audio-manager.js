export class AudioManager {
  constructor() {
    this.currentBgm = null;
    this.currentBgmKey = "";
    this.manifest = { bgm: {}, sfx: {}, jobs: {} };
    this.preloaded = {
      bgm: new Map(),
      sfx: new Map(),
      jobs: new Map()
    };
    this.bgmOptions = new Map();
    this._manifestPromise = null;
    this.ready = this.loadManifest();
  }

  async loadManifest() {
    if (this._manifestPromise) return this._manifestPromise;

    this._manifestPromise = (async () => {
      try {
        const response = await fetch(`./assets/audio/audio-manifest.json?v=${Date.now()}`);
        if (!response.ok) throw new Error(`manifest status ${response.status}`);
        const data = await response.json();
        this.manifest = {
          bgm: data?.bgm ?? {},
          sfx: data?.sfx ?? {},
          jobs: data?.jobs ?? {}
        };
      } catch (err) {
        console.warn("Audio manifest load failed", err);
        this.manifest = this.manifest || { bgm: {}, sfx: {}, jobs: {} };
      }

      this.preloaded = {
        bgm: new Map(),
        sfx: new Map(),
        jobs: new Map()
      };
      this.bgmOptions = new Map();

      await Promise.all([
        this.preloadCategory("bgm"),
        this.preloadCategory("sfx"),
        this.preloadJobCategory()
      ]);

      return this.manifest;
    })();

    return this._manifestPromise;
  }

  async getBgmOptions() {
    await this.ready;
    const bgm = this.manifest?.bgm ?? {};
    return Object.entries(bgm).map(([key, info]) => ({
      key,
      title: info?.title || key,
      loop: info?.loop !== false
    }));
  }

  async playBgmKey(key) {
    await this.ready;

    if (this.currentBgm) {
      this.currentBgm.pause();
      this.currentBgm = null;
    }

    if (!key) {
      this.currentBgmKey = "";
      return;
    }

    const cached = this.preloaded.bgm.get(key);
    if (!cached) {
      console.warn(`BGM key '${key}' not found`);
      this.currentBgmKey = "";
      return;
    }

    const options = this.bgmOptions.get(key) ?? {};
    const clone = cached.cloneNode(true);
    clone.loop = options.loop ?? cached.loop ?? true;
    clone.volume = options.volume ?? cached.volume ?? 0.5;

    try {
      await clone.play();
      this.currentBgm = clone;
      this.currentBgmKey = key;
    } catch (err) {
      console.warn("BGMの再生に失敗:", err);
      this.currentBgm = null;
      this.currentBgmKey = "";
    }
  }

  stopBgm() {
    if (!this.currentBgm) return;
    this.currentBgm.pause();
    this.currentBgm = null;
    this.currentBgmKey = "";
  }

  getCurrentBgmKey() {
    return this.currentBgmKey;
  }

  async preloadCategory(kind) {
    const entries = Object.entries(this.manifest?.[kind] ?? {});
    if (!entries.length) return;

    if (!this.preloaded[kind]) this.preloaded[kind] = new Map();

    await Promise.all(
      entries.map(async ([key, value]) => {
        if (kind === "bgm") {
          const config = this.normalizeBgmEntry(value);
          if (!config.path) return;
          const url = this.resolvePath(config.path);
          const audio = new Audio(url);
          audio.loop = config.loop;
          audio.volume = config.volume;
          this.preloaded.bgm.set(key, audio);
          this.bgmOptions.set(key, { loop: config.loop, volume: config.volume });
        } else {
          const path = this.resolveManifestPath(value);
          if (!path) return;
          const url = this.resolvePath(path);
          this.preloaded.sfx.set(key, url);
        }
      })
    );
  }

  async preloadJobCategory() {
    const jobs = this.manifest?.jobs ?? {};
    const tasks = [];

    Object.entries(jobs).forEach(([jobKey, sounds]) => {
      if (!this.preloaded.jobs.has(jobKey)) {
        this.preloaded.jobs.set(jobKey, new Map());
      }
      const jobMap = this.preloaded.jobs.get(jobKey);

      Object.entries(sounds ?? {}).forEach(([kind, relativePath]) => {
        const path = this.resolveManifestPath(relativePath);
        if (!path) return;

        const resolved = this.resolvePath(path);
        const task = fetch(resolved, { method: "HEAD" })
          .then((response) => {
            if (response.ok) {
              jobMap.set(kind, resolved);
            } else {
              console.warn(`Job audio not found (${jobKey}:${kind}) -> ${resolved}, status ${response.status}`);
            }
          })
          .catch((err) => {
            console.warn(`Job audio fetch failed (${jobKey}:${kind})`, err);
          });

        tasks.push(task);
      });
    });

    await Promise.all(tasks);

    for (const [jobKey, jobMap] of this.preloaded.jobs.entries()) {
      if (jobMap.size === 0) {
        this.preloaded.jobs.delete(jobKey);
      }
    }
  }

  playSfx(path, withEcho = false) {
    if (!withEcho) {
      const audio = new Audio(path);
      audio.volume = 0.7;
      audio.play().catch(() => {});
      return;
    }
    // --- エコー（フィードバック付き）再生 ---
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    fetch(path)
      .then(res => res.arrayBuffer())
      .then(buf => ctx.decodeAudioData(buf))
      .then(audioBuffer => {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        const delay = ctx.createDelay();
        delay.delayTime.value = 0.25;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.4; // 残響の強さ
        delay.connect(feedback);
        feedback.connect(delay);
        source.connect(delay);
        delay.connect(ctx.destination);
        source.start();
      });
  }

  async playSfxKey(key) {
    await this.ready;
    const url = this.preloaded.sfx.get(key);
    if (!url) {
      console.warn(`SFX key '${key}' not found`);
      return;
    }
    this.playSfx(url);
  }

  async playJobSfx(job, kind) {
    if (!job || !kind) return;
    await this.ready;
    const jobSounds = this.preloaded.jobs.get(job);
    const specific = jobSounds?.get(kind);
    const fallback = this.preloaded.sfx.get(`${kind}_default`) ?? this.preloaded.sfx.get(kind);
    const url = specific || fallback;
    if (!url) {
      console.warn(`Job SFX '${job}:${kind}' not found`);
      return;
    }
    // down時のみエコー付き再生
    this.playSfx(url, (kind === "down" || kind === "skill"));
  }

  normalizeBgmEntry(entry) {
    const defaults = { path: "", loop: true, volume: 0.5 };
    if (typeof entry === "string") {
      return { ...defaults, path: entry };
    }
    if (entry && typeof entry === "object") {
      const path = entry.path ?? entry.url ?? "";
      const loop = entry.loop !== undefined ? Boolean(entry.loop) : defaults.loop;
      const volume = entry.volume !== undefined ? Number(entry.volume) : defaults.volume;
      return { path, loop, volume: Number.isFinite(volume) ? Math.max(0, Math.min(volume, 1)) : defaults.volume };
    }
    return defaults;
  }

  resolveManifestPath(entry) {
    if (typeof entry === "string") return entry;
    if (entry && typeof entry === "object") {
      return entry.path ?? entry.url ?? "";
    }
    return "";
  }

  resolvePath(relativePath) {
    if (/^https?:\/\//.test(relativePath)) return relativePath;
    const base = new URL("./assets/audio/", window.location.href);
    return new URL(relativePath, base).toString();
  }
}

export const audioManager = new AudioManager();