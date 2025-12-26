
export const StorageAdapter = {
  async set(key: string, value: string) {
    localStorage.setItem(key, value);
  },

  async get(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  },

  async remove(key: string) {
    localStorage.removeItem(key);
  }
};
