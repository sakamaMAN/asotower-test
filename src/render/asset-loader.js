const DEFAULT_BASE = "./assets/images";
const MANIFEST_URL = "./config/asset-manifest.json?v=202510261714";

export class AssetLoader {
  constructor(basePath = null, manifest = null) {
    this.images = new Map();
    this.basePath = DEFAULT_BASE;
    this.manifest = {};
    this.ready = this.initialize(basePath, manifest);
  }

  async initialize(basePath, manifest) {
    const config = manifest
      ? { basePath: basePath ?? DEFAULT_BASE, manifest }
      : await this.loadManifestConfig();

    this.basePath = (basePath ?? config.basePath ?? DEFAULT_BASE).replace(/\/$/, "");
    this.manifest = this.buildManifest(config);

    await this.preload();
  }

  async loadManifestConfig() {
    const response = await fetch(`${MANIFEST_URL}?v=${Date.now()}`);
    if (!response.ok) throw new Error(`asset manifest load failed (${response.status})`);
    return await response.json();
  }

  buildManifest(config) {
    const result = {};
    const jobs = config.jobs ?? {};
    for (const [job, paths] of Object.entries(jobs)) {
      if (!paths?.default) continue;
      const baseKey = `job_${job}`;
      result[baseKey] = paths.default;
      for (const variant of ["attack", "skill", "win", "smoke"]) {
        const key = `${baseKey}_${variant}`;
        result[key] = paths[variant] ?? paths.default;
      }
    }

    const otherCategories = {
      castles: "castle",
      map: "map",
      effects: "effect",
      ui: "ui"
    };

    for (const [configKey, prefix] of Object.entries(otherCategories)) {
      const section = config[configKey];
      if (!section) continue;
      this.flattenSection(section, prefix, result);
    }

    return result;
  }

  flattenSection(section, prefix, result) {
    for (const [key, value] of Object.entries(section)) {
      const nextPrefix = prefix ? `${prefix}_${key}` : key;
      if (typeof value === "string") {
        result[nextPrefix] = value;
        continue;
      }
      if (value && typeof value === "object") {
        if (typeof value.default === "string") {
          result[nextPrefix] = value.default;
        }
        const nested = { ...value };
        delete nested.default;
        this.flattenSection(nested, nextPrefix, result);
      }
    }
  }

  async preload() {
    await Promise.all(Object.keys(this.manifest).map((key) => this.ensureImage(key)));
  }

  async ensureImage(key) {
    if (this.images.has(key)) return this.images.get(key);
    const path = this.manifest[key];
    if (!path) return null;
    const img = await this.loadSingle(key, path);
    return img;
  }

  loadSingle(key, relativePath) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(key, img);
        resolve(img);
      };
      img.onerror = async () => {
        const fallbackKey = this.getFallbackKey(key);
        if (fallbackKey) {
          const fallbackImg = await this.ensureImage(fallbackKey);
          if (fallbackImg) {
            this.images.set(key, fallbackImg);
            resolve(fallbackImg);
            return;
          }
        }
        console.warn(`画像読み込み失敗: ${relativePath}`);
        resolve(null);
      };
      img.src = this.resolvePath(relativePath);
    });
  }

  getFallbackKey(key) {
    const match = key.match(/^job_(.+)_(attack|skill|win|smoke)$/);
    if (!match) return null;
    const baseKey = `job_${match[1]}`;
    return this.manifest[baseKey] ? baseKey : null;
  }

  get(key) {
    return this.images.get(key) ?? null;
  }

  resolvePath(relativePath) {
    if (/^https?:\/\//.test(relativePath)) return relativePath;
    return `${this.basePath}/${relativePath}`.replace(/([^:]\/)\/+/g, "$1");
  }
}