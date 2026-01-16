export class Sandbox {
  static async importModule(path) {
    return import(path);
  }
}