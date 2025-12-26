
import { useEffect, useState } from 'react';
import { AppStateService } from '../lib/adapters/app-state';

export const useAppState = () => {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let removeListener: (() => void) | undefined;

    const init = async () => {
      // Estado inicial
      const current = await AppStateService.isActive();
      setIsActive(current);

      // SuscripciÃƒÂ³n
      removeListener = await AppStateService.onChange((active) => {
        setIsActive(active);
        console.log(`[AppState] App is now ${active ? 'FOREGROUND' : 'BACKGROUND'}`);
      });
    };

    init();

    return () => {
      if (removeListener) removeListener();
    };
  }, []);

  return { isActive };
};
