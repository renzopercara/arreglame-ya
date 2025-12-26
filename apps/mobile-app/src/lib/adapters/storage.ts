import { Capacitor } from '@capacitor/core';

/**
 * Helper para obtener el plugin de forma dinámica.
 * Usamos una función de importación indirecta para que TypeScript no intente
 * resolver la ruta del módulo @capacitor/preferences en tiempo de compilación.
 */
const getPreferencesPlugin = async (): Promise<any> => {
  try {
    // Definimos el nombre del módulo en una constante para evitar el análisis estático
    const moduleName = '@capacitor/preferences';
    const mod = await import(`${moduleName}`);
    return mod.Preferences;
  } catch (e) {
    // Si falla el import dinámico, retornamos null para usar localStorage como fallback
    return null;
  }
};

export const StorageAdapter = {
  async set(key: string, value: string): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        const Preferences = await getPreferencesPlugin();
        if (Preferences) {
          await Preferences.set({ key, value });
          return;
        }
      }
      localStorage.setItem(key, value);
    } catch (error) {
      localStorage.setItem(key, value);
    }
  },

  async get(key: string): Promise<string | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        const Preferences = await getPreferencesPlugin();
        if (Preferences) {
          const { value } = await Preferences.get({ key });
          return value;
        }
      }
      return localStorage.getItem(key);
    } catch (error) {
      return localStorage.getItem(key);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        const Preferences = await getPreferencesPlugin();
        if (Preferences) {
          await Preferences.remove({ key });
          return;
        }
      }
      localStorage.removeItem(key);
    } catch (error) {
      localStorage.removeItem(key);
    }
  },

  async clear(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        const Preferences = await getPreferencesPlugin();
        if (Preferences) {
          await Preferences.clear();
          return;
        }
      }
      localStorage.clear();
    } catch (error) {
      localStorage.clear();
    }
  }
};