// An in-memory replacement of @plasmohq/storage for tests
export const areas: { [area: string]: Map<string, any> } = {
  sync: new Map(),
  local: new Map(),
};

export class Storage {
  area: string;

  constructor(options: { area?: string } = {}) {
    this.area = options.area ?? "sync";
  }

  async get<T = any>(key: string): Promise<T> {
    return areas[this.area].get(key);
  }

  async set(key: string, value: any) {
    areas[this.area].set(key, value);
  }

  async clear() {
    areas[this.area].clear();
  }
}

export function resetStorage() {
  Object.values(areas).forEach((area) => area.clear());
}
