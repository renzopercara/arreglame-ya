import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp, AppState } from '@capacitor/app';

export interface IAppStateService {
  /**
   * Registra un listener para cambios de estado.
   * Retorna una funciÃƒÂ³n para desuscribirse.
   */
  onChange(callback: (isActive: boolean) => void): Promise<() => void>;
  
  /**
   * Obtiene el estado actual
   */
  isActive(): Promise<boolean>;
}

class NativeAppAdapter implements IAppStateService {
  async onChange(callback: (isActive: boolean) => void): Promise<() => void> {
    const handler = await CapacitorApp.addListener('appStateChange', (state: AppState) => {
      callback(state.isActive);
    });
    
    return () => {
      handler.remove();
    };
  }

  async isActive(): Promise<boolean> {
    const state = await CapacitorApp.getState();
    return state.isActive;
  }
}

class WebAppAdapter implements IAppStateService {
  async onChange(callback: (isActive: boolean) => void): Promise<() => void> {
    const handleVisibilityChange = () => {
      callback(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // TambiÃƒÂ©n escuchamos focus/blur para mayor precisiÃƒÂ³n en desktop
    window.addEventListener('focus', () => callback(true));
    window.addEventListener('blur', () => callback(false));

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', () => callback(true));
      window.removeEventListener('blur', () => callback(false));
    };
  }

  async isActive(): Promise<boolean> {
    return !document.hidden;
  }
}

export const AppStateService: IAppStateService = Capacitor.isNativePlatform()
  ? new NativeAppAdapter()
  : new WebAppAdapter();
