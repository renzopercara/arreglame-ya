
export interface IAppStateService {
  onChange(callback: (isActive: boolean) => void): Promise<() => void>;
  isActive(): Promise<boolean>;
}

class WebAppAdapter implements IAppStateService {
  async onChange(callback: (isActive: boolean) => void): Promise<() => void> {
    const handleVisibilityChange = () => {
      callback(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
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

export const AppStateService = new WebAppAdapter();
