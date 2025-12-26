
import { useEffect, useState } from 'react';
import { AppStateService } from '../lib/adapters/app-state.ts';

export const useAppState = () => {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let removeListener: (() => void) | undefined;
    const init = async () => {
      const current = await AppStateService.isActive();
      setIsActive(current);
      removeListener = await AppStateService.onChange(setIsActive);
    };
    init();
    return () => { if (removeListener) removeListener(); };
  }, []);

  return { isActive };
};
