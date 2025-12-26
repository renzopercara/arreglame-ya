
import React, { useEffect, useRef } from 'react';
import { useAppState } from '../hooks/useAppState.ts';
import { useGeoLocation } from '../hooks/useGeoLocation.ts';
import { UserRole } from '../types.ts';

interface AppStateControllerProps {
  userRole: UserRole;
  onRefreshData: () => void;
  onGpsRestored: (lat: number, lng: number) => void;
}

export const AppStateController: React.FC<AppStateControllerProps> = ({ 
  userRole, 
  onRefreshData,
  onGpsRestored 
}) => {
  const { isActive } = useAppState();
  const { getLocation } = useGeoLocation();
  const lastActiveRef = useRef<number>(Date.now());

  useEffect(() => {
    const handleResume = async () => {
      const now = Date.now();
      const timeBackgrounded = now - lastActiveRef.current;
      
      if (timeBackgrounded > 5000) {
        onRefreshData();
      }

      try {
        await getLocation();
      } catch (e) {
        console.warn("[AppStateController] GPS Wakeup failed", e);
      }
    };

    if (isActive) {
      handleResume();
      lastActiveRef.current = Date.now();
    } else {
      lastActiveRef.current = Date.now();
    }
  }, [isActive, onRefreshData, getLocation]);

  return null;
};
